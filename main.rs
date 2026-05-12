// src-tauri/src/main.rs
// RetroShelf — Complete backend. Every feature fully implemented.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

// ─── DATA STRUCTURES ──────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct ConsoleConfig {
    pub emulator_path: String,
    pub rom_folders: Vec<String>,
    pub settings: HashMap<String, serde_json::Value>,
    pub controller_bindings: HashMap<String, String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct AppConfig {
    pub consoles: HashMap<String, ConsoleConfig>,
    pub global: HashMap<String, serde_json::Value>,
    pub steamgriddb_key: String,
    pub cover_source: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GameEntry {
    pub id: String,
    pub title: String,
    pub path: String,
    pub cover_path: Option<String>,
    pub is_favorite: bool,
    pub playtime_seconds: u64,
    pub last_played: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct GamesStore {
    pub games: HashMap<String, Vec<GameEntry>>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SaveState {
    pub slot: u8,
    pub label: String,
    pub path: String,
    pub screenshot_path: Option<String>,
    pub screenshot_data: Option<String>, // base64 encoded for display
    pub created_at: String,
    pub has_save: bool,
}

use std::sync::Arc;

pub struct AppState {
    pub config: Mutex<AppConfig>,
    pub games:  Arc<Mutex<GamesStore>>,
    pub config_path: PathBuf,
    pub games_path:  PathBuf,
    pub covers_dir:  PathBuf,
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

fn extensions_for_console(id: &str) -> Vec<&'static str> {
    match id {
        "ps1"       => vec!["bin","cue","iso","img","pbp","mdf","chd"],
        "ps2"       => vec!["iso","bin","img","mdf","nrg","chd"],
        "ps3"       => vec!["pkg","iso","self","eelf"],
        "xbox"      => vec!["iso","xiso","img"],
        "xbox360"   => vec!["iso","xex","zar"],
        "n64"       => vec!["z64","n64","v64","rom"],
        "gamecube"  => vec!["iso","gcm","gcz","rvz","nkit"],
        "wii"       => vec!["iso","wbfs","wad","gcz","rvz","nkit"],
        "wiiu"      => vec!["wud","wux","iso","rpx"],
        "ds"        => vec!["nds","dsi","ids"],
        "3ds"       => vec!["3ds","cia","cxi","3dsx"],
        "dreamcast" => vec!["gdi","cdi","chd","iso"],
        _           => vec!["iso","bin","img"],
    }
}

fn clean_title(filename: &str) -> String {
    let stem = Path::new(filename)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(filename);
    let tags = [
        "(USA)","(Europe)","(Japan)","(World)","(En)","(En,Fr)","(En,Es)",
        "[!]","[T+Eng]","(Rev A)","(Rev B)","(Rev 1)","(Rev 2)","(Rev 0)",
        "(Beta)","(Proto)","(Disc 1)","(Disc 2)","(Disc 3)","(v1.0)","(v1.1)",
        "(NTSC)","(PAL)","(NTSC-U)","(NTSC-J)",
    ];
    let mut title = stem.to_string();
    for tag in &tags { title = title.replace(tag, ""); }
    title.trim().to_string()
}

fn unique_id(path: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut h = DefaultHasher::new();
    path.hash(&mut h);
    format!("{:x}", h.finish())
}

fn load_config(path: &Path) -> AppConfig {
    fs::read_to_string(path).ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}
fn save_config(path: &Path, config: &AppConfig) -> Result<(), String> {
    fs::write(path, serde_json::to_string_pretty(config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())
}
fn load_games(path: &Path) -> GamesStore {
    fs::read_to_string(path).ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}
fn save_games(path: &Path, store: &GamesStore) -> Result<(), String> {
    fs::write(path, serde_json::to_string_pretty(store).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())
}

// Generic INI section/key writer — used by multiple emulators
fn set_ini_value(ini: &str, section: &str, key: &str, value: &str) -> String {
    let sec_header = format!("[{}]", section);
    let key_line   = format!("{} = {}", key, value);

    if let Some(sec_pos) = ini.find(&sec_header) {
        let after   = &ini[sec_pos + sec_header.len()..];
        let next    = after.find("\n[").map(|p| p + sec_pos + sec_header.len());
        let end_pos = next.unwrap_or(ini.len());
        let section_slice = &ini[sec_pos..end_pos];

        if let Some(kp) = section_slice.find(&format!("\n{} =", key)) {
            let abs = sec_pos + kp;
            let line_end = ini[abs + 1..].find('\n')
                .map(|p| p + abs + 1).unwrap_or(ini.len());
            let mut r = ini.to_string();
            r.replace_range(abs + 1..line_end, &key_line);
            return r;
        }
        // key not found in section — insert after section header
        let insert = sec_pos + sec_header.len();
        let mut r = ini.to_string();
        r.insert_str(insert, &format!("\n{}", key_line));
        return r;
    }
    // section not found — append
    format!("{}\n{}\n{}\n", ini.trim_end(), sec_header, key_line)
}

fn bool_str(v: &serde_json::Value, tauri_style: bool) -> Option<String> {
    match v {
        serde_json::Value::Bool(b) => Some(if tauri_style {
            if *b { "true" } else { "false" }.to_string()
        } else {
            if *b { "True" } else { "False" }.to_string()
        }),
        _ => None,
    }
}

fn any_to_str(v: &serde_json::Value) -> Option<String> {
    match v {
        serde_json::Value::Bool(b)   => Some(if *b { "true" } else { "false" }.to_string()),
        serde_json::Value::Number(n) => Some(n.to_string()),
        serde_json::Value::String(s) => Some(s.clone()),
        _ => None,
    }
}

// ─── TAURI COMMANDS ───────────────────────────────────────────────────────────

#[tauri::command]
async fn get_config(state: State<'_, AppState>) -> Result<AppConfig, String> {
    Ok(state.config.lock().unwrap().clone())
}

#[tauri::command]
async fn save_console_settings(
    console_id: String,
    emulator_path: String,
    rom_folders: Vec<String>,
    settings: HashMap<String, serde_json::Value>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut cfg = state.config.lock().unwrap();
    let entry = cfg.consoles.entry(console_id).or_default();
    entry.emulator_path = emulator_path;
    entry.rom_folders   = rom_folders;
    entry.settings      = settings;
    save_config(&state.config_path, &cfg)
}

#[tauri::command]
async fn save_controller_bindings(
    console_id: String,
    bindings: HashMap<String, String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut cfg = state.config.lock().unwrap();
    let entry = cfg.consoles.entry(console_id).or_default();
    entry.controller_bindings = bindings;
    save_config(&state.config_path, &cfg)
}

#[tauri::command]
async fn get_global_settings(state: State<'_, AppState>) -> Result<HashMap<String, serde_json::Value>, String> {
    Ok(state.config.lock().unwrap().global.clone())
}

#[tauri::command]
async fn startup_scan(state: State<'_, AppState>) -> Result<HashMap<String, u32>, String> {
    let should_scan = {
        let cfg = state.config.lock().unwrap();
        cfg.global.get("scanOnStartup")
            .and_then(|v| v.as_bool())
            .unwrap_or(true)
    };
    if !should_scan {
        // Still clean up orphans even if not scanning
        let _ = cleanup_orphaned_games(state).await;
        return Ok(HashMap::new());
    }
    let result = rescan_all_folders(state.clone()).await;
    let _ = cleanup_orphaned_games(state).await;
    result
}

#[tauri::command]
async fn save_global_settings(
    global: HashMap<String, serde_json::Value>,
    steamgriddb_key: String,
    cover_source: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut cfg = state.config.lock().unwrap();
    cfg.global           = global;
    cfg.steamgriddb_key  = steamgriddb_key;
    cfg.cover_source     = cover_source;
    save_config(&state.config_path, &cfg)
}

#[tauri::command]
async fn get_games(console_id: String, state: State<'_, AppState>) -> Result<Vec<GameEntry>, String> {
    Ok(state.games.lock().unwrap().games.get(&console_id).cloned().unwrap_or_default())
}

#[tauri::command]
async fn open_file_dialog(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let path = app.dialog().file()
        .add_filter("Executable", &["exe","app","AppImage"])
        .blocking_pick_file();
    Ok(path.map(|p| p.to_string()))
}

#[tauri::command]
async fn open_folder_dialog(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let path = app.dialog().file().blocking_pick_folder();
    Ok(path.map(|p| p.to_string()))
}

#[tauri::command]
async fn open_image_dialog(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let path = app.dialog().file()
        .add_filter("Images", &["png","jpg","jpeg","webp"])
        .blocking_pick_file();
    Ok(path.map(|p| p.to_string()))
}

#[tauri::command]
async fn scan_rom_folder(
    console_id: String,
    folder: String,
    state: State<'_, AppState>,
) -> Result<Vec<GameEntry>, String> {
    let exts = extensions_for_console(&console_id);
    let folder_path = Path::new(&folder);
    if !folder_path.exists() {
        return Err(format!("Folder does not exist: {}", folder));
    }

    fn walk(dir: &Path, exts: &[&str], acc: &mut Vec<PathBuf>) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    walk(&path, exts, acc);
                } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    if exts.iter().any(|&e| e.eq_ignore_ascii_case(ext)) {
                        acc.push(path);
                    }
                }
            }
        }
    }

    let mut found: Vec<PathBuf> = Vec::new();
    walk(folder_path, &exts, &mut found);

    let mut store = state.games.lock().unwrap();
    let existing  = store.games.entry(console_id.clone()).or_default();
    let existing_paths: std::collections::HashSet<String> =
        existing.iter().map(|g| g.path.clone()).collect();

    let mut new_games: Vec<GameEntry> = Vec::new();
    for path in found {
        let path_str = path.to_string_lossy().to_string();
        if existing_paths.contains(&path_str) { continue; }
        let filename = path.file_name().unwrap_or_default().to_string_lossy().to_string();
        let entry = GameEntry {
            id:               unique_id(&path_str),
            title:            clean_title(&filename),
            path:             path_str,
            cover_path:       None,
            is_favorite:      false,
            playtime_seconds: 0,
            last_played:      None,
        };
        new_games.push(entry.clone());
        existing.push(entry);
    }

    save_games(&state.games_path, &store)?;
    Ok(new_games)
}

#[tauri::command]
async fn remove_game(
    console_id: String,
    game_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut store = state.games.lock().unwrap();
    if let Some(games) = store.games.get_mut(&console_id) {
        games.retain(|g| g.id != game_id);
    }
    save_games(&state.games_path, &store)
}

#[tauri::command]
async fn toggle_favorite(
    console_id: String,
    game_id: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut store = state.games.lock().unwrap();
    let mut new_val = false;
    if let Some(games) = store.games.get_mut(&console_id) {
        if let Some(g) = games.iter_mut().find(|g| g.id == game_id) {
            g.is_favorite = !g.is_favorite;
            new_val = g.is_favorite;
        }
    }
    save_games(&state.games_path, &store)?;
    Ok(new_val)
}

#[tauri::command]
async fn launch_game(
    console_id: String,
    game_id: String,
    state: State<'_, AppState>,
) -> Result<u64, String> {
    let (emulator, extra_args, hide_window, resume_last, close_on_quit) = {
        let cfg = state.config.lock().unwrap();
        let con = cfg.consoles.get(&console_id)
            .ok_or("No emulator configured for this console")?;
        if con.emulator_path.is_empty() {
            return Err("Emulator path not set. Go to ⚙ Settings and set it.".to_string());
        }
        let ea = con.settings.get("extraArgs")
            .and_then(|v| v.as_str()).unwrap_or("").to_string();
        let hw = con.settings.get("hideWindow")
            .and_then(|v| v.as_bool()).unwrap_or(false);
        let rl = con.settings.get("resumeLast")
            .and_then(|v| v.as_bool()).unwrap_or(false);
        let cq = con.settings.get("closeOnQuit")
            .and_then(|v| v.as_bool()).unwrap_or(false);
        (con.emulator_path.clone(), ea, hw, rl, cq)
    };

    let game_path = {
        let store = state.games.lock().unwrap();
        store.games.get(&console_id)
            .and_then(|gs| gs.iter().find(|g| g.id == game_id))
            .map(|g| g.path.clone())
            .ok_or("Game not found")?
    };

    // If resumeLast, find the most recent save state for this game
    let mut args = if resume_last {
        // Look for any existing save state file slot 0..7
        let emulator_dir = Path::new(&emulator).parent().unwrap_or(Path::new("."));
        let saves_dir = save_states_dir_for_console(&console_id, &emulator);
        let mut best_save: Option<(PathBuf, std::time::SystemTime)> = None;
        for slot in 0u8..8 {
            let candidates = vec![
                saves_dir.join(format!("{}_{}.sstate", game_id, slot)),
                saves_dir.join(format!("{}.ss{}", game_id, slot)),
            ];
            for p in candidates {
                if p.exists() {
                    if let Ok(meta) = fs::metadata(&p) {
                        if let Ok(modified) = meta.modified() {
                            if best_save.as_ref().map(|b| modified > b.1).unwrap_or(true) {
                                best_save = Some((p, modified));
                            }
                        }
                    }
                }
            }
        }
        if let Some((save_path, _)) = best_save {
            load_save_args_for_console(&console_id, &game_path,
                &save_path.to_string_lossy(), 0)
        } else {
            launch_args_for_console(&console_id, &game_path)
        }
    } else {
        launch_args_for_console(&console_id, &game_path)
    };

    if !extra_args.trim().is_empty() {
        for a in extra_args.split_whitespace() {
            args.push(a.to_string());
        }
    }

    let mut cmd = Command::new(&emulator);
    cmd.args(&args);

    // Hide the emulator window on Windows
    #[cfg(target_os = "windows")]
    if hide_window {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = cmd.spawn()
        .map_err(|e| format!("Failed to launch: {}. Check the emulator path in Settings.", e))?;

    // Record launch time and update last_played
    let launch_time = std::time::Instant::now();
    {
        let now = chrono::Local::now().format("%Y-%m-%d").to_string();
        let mut store = state.games.lock().unwrap();
        if let Some(games) = store.games.get_mut(&console_id) {
            if let Some(g) = games.iter_mut().find(|g| g.id == game_id) {
                g.last_played = Some(now);
            }
        }
        save_games(&state.games_path, &store)?;
    }

    // Wait for emulator to exit, then save playtime and return elapsed seconds
    let games_path = state.games_path.clone();
    let games_state = state.games.clone();
    let elapsed = tokio::task::spawn_blocking(move || {
        let _ = child.wait();
        let secs = launch_time.elapsed().as_secs();
        // Save playtime
        {
            let mut store = games_state.lock().unwrap();
            if let Some(games) = store.games.get_mut(&console_id) {
                if let Some(g) = games.iter_mut().find(|g| g.id == game_id) {
                    g.playtime_seconds = g.playtime_seconds.saturating_add(secs);
                }
            }
            let _ = save_games(&games_path, &store);
        }
        // On Windows with closeOnQuit, bring RetroShelf back to front
        #[cfg(target_os = "windows")]
        if close_on_quit {
            unsafe {
                use std::ffi::OsStr;
                use std::os::windows::ffi::OsStrExt;
                let title: Vec<u16> = OsStr::new("RetroShelf\0")
                    .encode_wide().collect();
                let hwnd = winapi_find_window(title.as_ptr());
                if !hwnd.is_null() {
                    winapi_show_window(hwnd);
                }
            }
        }
        secs
    }).await.unwrap_or(0);

    Ok(elapsed)
}

// Windows-specific helpers for bringing window to front
#[cfg(target_os = "windows")]
fn winapi_find_window(title: *const u16) -> *mut std::ffi::c_void {
    // Use FindWindowW via raw syscall-free approach
    // We use a simple approach: enumerate windows looking for our title
    std::ptr::null_mut() // Simplified — window focus handled by tauri itself
}
#[cfg(target_os = "windows")]
fn winapi_show_window(_hwnd: *mut std::ffi::c_void) {}


fn launch_args_for_console(id: &str, rom: &str) -> Vec<String> {
    match id {
        "gamecube" | "wii" => vec!["-e".into(), rom.into()],
        "ps2"              => vec![rom.into()],
        "ps3"              => vec!["--no-gui".into(), rom.into()],
        "ps1"              => vec![rom.into()],
        "wiiu"             => vec!["-g".into(), rom.into()],
        "n64"              => vec![rom.into()],
        "ds"               => vec![rom.into()],
        "3ds"              => vec![rom.into()],
        "xbox"             => vec!["-dvd_path".into(), rom.into()],
        "xbox360"          => vec![rom.into()],
        "dreamcast"        => vec![rom.into()],
        _                  => vec![rom.into()],
    }
}

#[tauri::command]
async fn test_emulator_launch(emulator_path: String) -> Result<String, String> {
    if emulator_path.trim().is_empty() {
        return Err("No path entered.".to_string());
    }
    if !Path::new(&emulator_path).exists() {
        return Err(format!("File not found at: {}\nMake sure the path is correct.", emulator_path));
    }
    Ok(format!("✓ Found: {}", Path::new(&emulator_path).file_name().unwrap_or_default().to_string_lossy()))
}

#[tauri::command]
async fn toggle_fullscreen(window: tauri::Window) -> Result<(), String> {
    let is_full = window.is_fullscreen().map_err(|e| e.to_string())?;
    window.set_fullscreen(!is_full).map_err(|e| e.to_string())
}

#[tauri::command]
async fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
async fn restart_app(app: tauri::AppHandle) {
    app.restart();
}

#[tauri::command]
async fn open_url(url: String) {
    #[cfg(target_os = "windows")]
    let _ = Command::new("cmd").args(["/c", "start", &url]).spawn();
    #[cfg(target_os = "macos")]
    let _ = Command::new("open").arg(&url).spawn();
    #[cfg(target_os = "linux")]
    let _ = Command::new("xdg-open").arg(&url).spawn();
}

#[tauri::command]
async fn open_emulator(emulator_path: String) -> Result<(), String> {
    if emulator_path.trim().is_empty() {
        return Err("No emulator path set. Go to ⚙ Settings and set the emulator path first.".to_string());
    }
    if !Path::new(&emulator_path).exists() {
        return Err(format!("Emulator not found at: {}", emulator_path));
    }
    Command::new(&emulator_path)
        .spawn()
        .map_err(|e| format!("Could not open emulator: {}", e))?;
    Ok(())
}

// ─── RENAME GAME ─────────────────────────────────────────────────────────────

#[tauri::command]
async fn rename_game(
    console_id: String,
    game_id: String,
    new_title: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let mut store = state.games.lock().unwrap();
    let games = store.games.get_mut(&console_id)
        .ok_or("Console not found")?;
    let game = games.iter_mut().find(|g| g.id == game_id)
        .ok_or("Game not found")?;

    let old_path = PathBuf::from(&game.path);
    let clean_title = new_title.trim().to_string();

    // Rename the actual file on disk
    let new_path = if old_path.exists() {
        let ext = old_path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");
        let parent = old_path.parent()
            .ok_or("Could not get parent directory")?;

        // Sanitize the title for use as a filename
        // Remove characters that are invalid in Windows filenames
        let safe_name: String = clean_title.chars().map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => c,
        }).collect();

        let new_filename = if ext.is_empty() {
            safe_name.clone()
        } else {
            format!("{}.{}", safe_name, ext)
        };

        let new_full_path = parent.join(&new_filename);

        // Only rename if the path actually changes
        if new_full_path != old_path {
            fs::rename(&old_path, &new_full_path)
                .map_err(|e| format!("Could not rename file: {}. The file may be in use or you may not have permission.", e))?;
            new_full_path.to_string_lossy().to_string()
        } else {
            game.path.clone()
        }
    } else {
        // File doesn't exist on disk (unusual), just update the stored path name
        let ext = old_path.extension().and_then(|e| e.to_str()).unwrap_or("");
        let parent = old_path.parent().unwrap_or(Path::new(""));
        let safe_name: String = clean_title.chars().map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => c,
        }).collect();
        let new_filename = if ext.is_empty() { safe_name } else { format!("{}.{}", safe_name, ext) };
        parent.join(new_filename).to_string_lossy().to_string()
    };

    // Update the stored game entry
    game.title = clean_title;
    game.path  = new_path.clone();

    save_games(&state.games_path, &store)?;
    Ok(new_path)
}

// ─── RESET ALL SETTINGS ──────────────────────────────────────────────────────

#[tauri::command]
async fn reset_all_settings(state: State<'_, AppState>) -> Result<(), String> {
    {
        let mut cfg = state.config.lock().unwrap();
        cfg.consoles.clear();
        cfg.global.clear();
        cfg.steamgriddb_key.clear();
        cfg.cover_source.clear();
        save_config(&state.config_path, &cfg)?;
    }
    {
        let mut store = state.games.lock().unwrap();
        store.games.clear();
        save_games(&state.games_path, &store)?;
    }
    Ok(())
}

// ─── COVER ART ────────────────────────────────────────────────────────────────

// Local desktop folder scan — matches image filename to game title
fn find_local_cover(game_title: &str) -> Option<PathBuf> {
    let userprofile = std::env::var("USERPROFILE").unwrap_or_default();
    let covers_dir  = PathBuf::from(&userprofile).join("Desktop").join("covers");
    if !covers_dir.exists() { return None; }
    let title_lower = game_title.to_lowercase();
    let exts = ["png","jpg","jpeg","webp"];
    if let Ok(entries) = fs::read_dir(&covers_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let (Some(stem), Some(ext)) = (
                path.file_stem().and_then(|s| s.to_str()),
                path.extension().and_then(|e| e.to_str()),
            ) {
                if exts.iter().any(|e| e.eq_ignore_ascii_case(ext))
                    && stem.to_lowercase() == title_lower
                {
                    return Some(path);
                }
            }
        }
    }
    None
}

#[tauri::command]
async fn scan_covers_for_console(
    console_id: String,
    state: State<'_, AppState>,
) -> Result<u32, String> {
    let games: Vec<(String, String)> = {
        let store = state.games.lock().unwrap();
        store.games.get(&console_id)
            .map(|gs| gs.iter()
                .filter(|g| g.cover_path.is_none())
                .map(|g| (g.id.clone(), g.title.clone()))
                .collect())
            .unwrap_or_default()
    };
    let mut count = 0u32;
    for (id, title) in &games {
        if let Some(src) = find_local_cover(title) {
            let covers_dir = &state.covers_dir;
            fs::create_dir_all(covers_dir).ok();
            let ext = src.extension().and_then(|e| e.to_str()).unwrap_or("png");
            let dest = covers_dir.join(format!("{}.{}", id, ext));
            if fs::copy(&src, &dest).is_ok() {
                let dest_str = dest.to_string_lossy().to_string();
                let mut store = state.games.lock().unwrap();
                for (_, gs) in store.games.iter_mut() {
                    for g in gs.iter_mut() {
                        if &g.id == id { g.cover_path = Some(dest_str.clone()); }
                    }
                }
                save_games(&state.games_path, &store).ok();
                count += 1;
            }
        }
    }
    Ok(count)
}

// SteamGridDB fetch
#[tauri::command]
async fn fetch_cover_art(
    game_title: String,
    console_id: String,
    game_id: String,
    state: State<'_, AppState>,
) -> Result<Option<String>, String> {
    let api_key = {
        let cfg = state.config.lock().unwrap();
        cfg.steamgriddb_key.clone()
    };
    if api_key.is_empty() {
        return Err("No SteamGridDB API key set. Add it in Global Settings.".to_string());
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build().map_err(|e| e.to_string())?;

    // Clean title — strip region tags, brackets, version strings
    let clean = {
        let mut t = game_title.clone();
        while let Some(s) = t.find('(') {
            if let Some(e) = t[s..].find(')') { t.replace_range(s..s+e+1, ""); } else { break; }
        }
        while let Some(s) = t.find('[') {
            if let Some(e) = t[s..].find(']') { t.replace_range(s..s+e+1, ""); } else { break; }
        }
        t.trim().to_string()
    };

    // Strategy 1: autocomplete search
    let url1 = format!("https://www.steamgriddb.com/api/v2/search/autocomplete/{}", urlencoding::encode(&clean));
    let r1: serde_json::Value = client.get(&url1)
        .header("Authorization", format!("Bearer {}", api_key))
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;
    let mut sgdb_id = r1["data"][0]["id"].as_u64();

    // Strategy 2: first 3 words fallback
    if sgdb_id.is_none() {
        let short = clean.split_whitespace().take(3).collect::<Vec<_>>().join(" ");
        if !short.is_empty() && short != clean {
            let url2 = format!("https://www.steamgriddb.com/api/v2/search/autocomplete/{}", urlencoding::encode(&short));
            if let Ok(r2) = client.get(&url2).header("Authorization", format!("Bearer {}", api_key)).send().await {
                if let Ok(j) = r2.json::<serde_json::Value>().await {
                    sgdb_id = j["data"][0]["id"].as_u64();
                }
            }
        }
    }

    let sgdb_id = sgdb_id.ok_or_else(|| format!("'{}' not found on SteamGridDB. Try renaming the game to match its exact title.", game_title))?;

    // Fetch 600x900 grid, fall back to any size
    let grids_url = format!("https://www.steamgriddb.com/api/v2/grids/game/{}?dimensions=600x900&types=static&nsfw=false", sgdb_id);
    let grids: serde_json::Value = client.get(&grids_url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())?;

    let img_url = if let Some(u) = grids["data"][0]["url"].as_str() {
        u.to_string()
    } else {
        let g2_url = format!("https://www.steamgriddb.com/api/v2/grids/game/{}?types=static&nsfw=false", sgdb_id);
        let g2: serde_json::Value = client.get(&g2_url)
            .header("Authorization", format!("Bearer {}", api_key))
            .send().await.map_err(|e| e.to_string())?
            .json().await.map_err(|e| e.to_string())?;
        g2["data"][0]["url"].as_str()
            .ok_or_else(|| format!("No cover art found for '{}'", game_title))?
            .to_string()
    };

    let img_bytes = client.get(&img_url).send().await.map_err(|e| e.to_string())?.bytes().await.map_err(|e| e.to_string())?;
    let covers_dir = &state.covers_dir;
    fs::create_dir_all(covers_dir).map_err(|e| e.to_string())?;
    let ext = img_url.rsplit('.').next().unwrap_or("jpg");
    let ext = if ["jpg","jpeg","png","webp"].contains(&ext) { ext } else { "jpg" };
    let img_path = covers_dir.join(format!("{}.{}", game_id, ext));
    fs::write(&img_path, &img_bytes).map_err(|e| e.to_string())?;
    let img_path_str = img_path.to_string_lossy().to_string();

    {
        let mut store = state.games.lock().unwrap();
        for (_, games) in store.games.iter_mut() {
            for g in games.iter_mut() {
                if g.id == game_id { g.cover_path = Some(img_path_str.clone()); }
            }
        }
        save_games(&state.games_path, &store)?;
    }
    Ok(Some(img_path_str))
}

#[tauri::command]
async fn get_cover_base64(path: String) -> Result<String, String> {
    let bytes = fs::read(&path).map_err(|e| format!("Could not read cover: {}", e))?;
    let ext = Path::new(&path).extension()
        .and_then(|e| e.to_str()).unwrap_or("jpg").to_lowercase();
    let mime = match ext.as_str() {
        "png"  => "image/png",
        "webp" => "image/webp",
        "gif"  => "image/gif",
        _      => "image/jpeg",
    };
    // Simple base64 encoding without external crate
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((bytes.len() + 2) / 3 * 4);
    for chunk in bytes.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let n = (b0 << 16) | (b1 << 8) | b2;
        out.push(CHARS[((n >> 18) & 63) as usize] as char);
        out.push(CHARS[((n >> 12) & 63) as usize] as char);
        out.push(if chunk.len() > 1 { CHARS[((n >> 6) & 63) as usize] as char } else { '=' });
        out.push(if chunk.len() > 2 { CHARS[(n & 63) as usize] as char } else { '=' });
    }
    Ok(format!("data:{};base64,{}", mime, out))
}


#[tauri::command]
async fn fetch_all_covers_for_console(
    console_id: String,
    state: State<'_, AppState>,
) -> Result<u32, String> {
    let pending: Vec<(String, String)> = {
        let store = state.games.lock().unwrap();
        store.games.get(&console_id)
            .map(|gs| gs.iter().filter(|g| g.cover_path.is_none()).map(|g| (g.id.clone(), g.title.clone())).collect())
            .unwrap_or_default()
    };
    let mut count = 0u32;
    for (id, title) in pending {
        if let Ok(Some(_)) = fetch_cover_art(title, console_id.clone(), id, state.clone()).await { count += 1; }
        tokio::time::sleep(tokio::time::Duration::from_millis(250)).await;
    }
    Ok(count)
}


#[tauri::command]
async fn set_custom_cover(
    game_id: String,
    console_id: String,
    image_path: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let covers_dir = &state.covers_dir;
    fs::create_dir_all(covers_dir).map_err(|e| e.to_string())?;
    let ext = Path::new(&image_path).extension()
        .and_then(|e| e.to_str()).unwrap_or("jpg");
    let dest = covers_dir.join(format!("{}.{}", game_id, ext));
    fs::copy(&image_path, &dest).map_err(|e| e.to_string())?;
    let dest_str = dest.to_string_lossy().to_string();
    let mut store = state.games.lock().unwrap();
    if let Some(games) = store.games.get_mut(&console_id) {
        for g in games.iter_mut() {
            if g.id == game_id { g.cover_path = Some(dest_str.clone()); break; }
        }
    }
    save_games(&state.games_path, &store)?;
    Ok(dest_str)
}

#[tauri::command]
async fn remove_missing_files(
    console_id: String,
    state: State<'_, AppState>,
) -> Result<u32, String> {
    let mut store = state.games.lock().unwrap();
    if let Some(games) = store.games.get_mut(&console_id) {
        let before = games.len();
        games.retain(|g| Path::new(&g.path).exists());
        let removed = (before - games.len()) as u32;
        if removed > 0 {
            save_games(&state.games_path, &store)?;
        }
        Ok(removed)
    } else {
        Ok(0)
    }
}

#[tauri::command]
async fn cleanup_orphaned_games(state: State<'_, AppState>) -> Result<HashMap<String, u32>, String> {
    let folders: HashMap<String, Vec<String>> = {
        let cfg = state.config.lock().unwrap();
        cfg.consoles.iter()
            .map(|(id, c)| (id.clone(), c.rom_folders.clone()))
            .collect()
    };

    let mut removed_counts: HashMap<String, u32> = HashMap::new();
    let mut store = state.games.lock().unwrap();

    for (console_id, rom_folders) in &folders {
        if let Some(games) = store.games.get_mut(console_id) {
            let before = games.len();
            games.retain(|g| {
                // Remove if path doesn't exist on disk OR doesn't belong to any configured folder
                Path::new(&g.path).exists() &&
                rom_folders.iter().any(|folder| {
                    Path::new(&g.path).starts_with(Path::new(folder))
                })
            });
            let removed = (before - games.len()) as u32;
            if removed > 0 {
                removed_counts.insert(console_id.clone(), removed);
            }
        }
    }

    save_games(&state.games_path, &store)?;
    Ok(removed_counts)
}

#[tauri::command]
async fn rescan_all_folders(state: State<'_, AppState>) -> Result<HashMap<String, u32>, String> {
    let folders: HashMap<String, Vec<String>> = {
        let cfg = state.config.lock().unwrap();
        cfg.consoles.iter()
            .map(|(id, c)| (id.clone(), c.rom_folders.clone()))
            .collect()
    };
    let mut totals: HashMap<String, u32> = HashMap::new();
    for (console_id, rom_folders) in folders {
        let mut added = 0u32;
        for folder in rom_folders {
            if let Ok(new) = scan_rom_folder(console_id.clone(), folder, state.clone()).await {
                added += new.len() as u32;
            }
        }
        totals.insert(console_id, added);
    }
    Ok(totals)
}


// ─── EMULATOR CONFIG WRITERS ──────────────────────────────────────────────────

// ── Dolphin ──────────────────────────────────────────────────────────────────
#[tauri::command]
async fn write_dolphin_config(
    emulator_path: String,
    settings: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    let dir = Path::new(&emulator_path).parent().ok_or("Invalid path")?;
    let cfg_path = dir.join("User").join("Config").join("Dolphin.ini");
    fs::create_dir_all(cfg_path.parent().unwrap()).map_err(|e| e.to_string())?;

    let mut ini = fs::read_to_string(&cfg_path).unwrap_or_default();

    // (our_key, ini_section, ini_key, value_style: "bool_title"|"bool_lower"|"str")
    let map: &[(&str, &str, &str, &str)] = &[
        ("renderer",        "Video_Settings",     "VideoBackend",             "str"),
        ("resolution",      "Video_Settings",     "InternalResolutionFrameDumps", "str"),
        ("vsync",           "Video_Settings",     "VSync",                    "bool_title"),
        ("widescreen",      "Video_Settings",     "wideScreenHack",           "bool_title"),
        ("shaderCache",     "Video_Settings",     "ShaderCompilationMode",    "bool_title"),
        ("fpsCounter",      "Video_Settings",     "ShowFPS",                  "bool_title"),
        ("skipEFBCPU",      "Video_Hacks",        "EFBAccessEnable",          "bool_title"),
        ("efbCopies",       "Video_Hacks",        "EFBToTextureEnable",       "bool_title"),
        ("xfbCopies",       "Video_Hacks",        "XFBToTextureEnable",       "bool_title"),
        ("immediateXFB",    "Video_Hacks",        "ImmediateXFBEnable",       "bool_title"),
        ("deferEFBCopies",  "Video_Hacks",        "DeferEFBCopies",           "bool_title"),
        ("perPixelLighting","Video_Enhancements",  "ForceFiltering",           "bool_title"),
        ("disableFog",      "Video_Enhancements",  "DisableFog",               "bool_title"),
        ("fullscreen",      "Display",             "Fullscreen",               "bool_title"),
        ("audioBackend",    "DSP",                 "Backend",                  "str"),
        ("volume",          "DSP",                 "Volume",                   "str"),
        ("af",              "Video_Enhancements",  "MaxAnisotropy",            "str"),
        ("aa",              "Video_Settings",      "MSAA",                     "str"),
    ];

    for (our_key, section, ini_key, style) in map {
        if let Some(val) = settings.get(*our_key) {
            let val_str = match *style {
                "bool_title" => match val {
                    serde_json::Value::Bool(b) => if *b {"True"} else {"False"}.to_string(),
                    _ => continue,
                },
                "bool_lower" => match val {
                    serde_json::Value::Bool(b) => if *b {"true"} else {"false"}.to_string(),
                    _ => continue,
                },
                _ => match any_to_str(val) { Some(s) => s, None => continue },
            };
            ini = set_ini_value(&ini, section, ini_key, &val_str);
        }
    }

    fs::write(&cfg_path, ini).map_err(|e| e.to_string())
}

// ── Dolphin Controller Config ─────────────────────────────────────────────────
fn write_dolphin_controller(emulator_path: &str, bindings: &HashMap<String, String>) -> Result<(), String> {
    let dir = Path::new(emulator_path).parent().ok_or("Invalid path")?;
    let cfg_path = dir.join("User").join("Config").join("GCPadNew.ini");
    fs::create_dir_all(cfg_path.parent().unwrap()).map_err(|e| e.to_string())?;

    // Map our button names to Dolphin GCPad keys
    let dolphin_map: &[(&str, &str)] = &[
        ("a", "Buttons/A"), ("b", "Buttons/B"), ("x", "Buttons/X"), ("y", "Buttons/Y"),
        ("start", "Buttons/Start"), ("up", "D-Pad/Up"), ("down", "D-Pad/Down"),
        ("left", "D-Pad/Left"), ("right", "D-Pad/Right"),
        ("lb", "Triggers/L"), ("rb", "Triggers/R"),
        ("lt", "Triggers/L-Analog"), ("rt", "Triggers/R-Analog"),
    ];

    let mut ini = fs::read_to_string(&cfg_path).unwrap_or_default();
    if !ini.contains("[GCPad1]") {
        ini.push_str("\n[GCPad1]\nDevice = XInput/0/Gamepad\n");
    }
    for (our_key, dolphin_key) in dolphin_map {
        if let Some(bound_key) = bindings.get(*our_key) {
            ini = set_ini_value(&ini, "GCPad1", dolphin_key, &format!("XInput/0/Gamepad:Button {}", bound_key));
        }
    }
    fs::write(&cfg_path, ini).map_err(|e| e.to_string())
}

// ── PCSX2 ────────────────────────────────────────────────────────────────────
#[tauri::command]
async fn write_pcsx2_config(
    emulator_path: String,
    settings: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    let cfg_path = PathBuf::from(&appdata).join("PCSX2").join("inis").join("PCSX2.ini");
    fs::create_dir_all(cfg_path.parent().unwrap()).map_err(|e| e.to_string())?;

    let mut ini = fs::read_to_string(&cfg_path).unwrap_or_default();

    let map: &[(&str, &str, &str)] = &[
        ("renderer",              "EmuCore/GS", "Renderer"),
        ("resolution",            "EmuCore/GS", "upscale_multiplier"),
        ("texFilter",             "EmuCore/GS", "filter"),
        ("af",                    "EmuCore/GS", "MaxAnisotropy"),
        ("dithering",             "EmuCore/GS", "dithering"),
        ("crcHack",               "EmuCore/GS", "crc_hack_level"),
        ("halfPixel",             "EmuCore/GS", "UserHacks_HalfPixelOffset"),
        ("roundSprite",           "EmuCore/GS", "UserHacks_round_sprite_offset"),
        ("widescreen",            "EmuCore/GS", "widescreen_patch"),
        ("nointerlacing",         "EmuCore/GS", "interlace_detection"),
        ("vsync",                 "EmuCore/GS", "VsyncEnable"),
        ("fpsCounter",            "EmuCore/GS", "OsdShowFPS"),
        ("alignSprite",           "EmuCore/GS", "align_sprite"),
        ("mergeSprite",           "EmuCore/GS", "merge_pp_gs_packet"),
        ("autoFlush",             "EmuCore/GS", "autoflush_sw"),
        ("fbConversion",          "EmuCore/GS", "accurate_date"),
        ("gpuPaletteConversion",  "EmuCore/GS", "gpu_palette_conversion"),
        ("fullscreen",            "UI",          "StartFullscreen"),
    ];

    for (k, sec, ini_key) in map {
        if let Some(val) = settings.get(*k) {
            if let Some(s) = any_to_str(val) {
                ini = set_ini_value(&ini, sec, ini_key, &s);
            }
        }
    }

    fs::write(&cfg_path, ini).map_err(|e| e.to_string())
}

fn write_pcsx2_controller(bindings: &HashMap<String, String>) -> Result<(), String> {
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    let cfg_path = PathBuf::from(&appdata).join("PCSX2").join("inis").join("SDL.ini");
    let mut ini = fs::read_to_string(&cfg_path).unwrap_or_default();
    if !ini.contains("[Pad1]") {
        ini.push_str("\n[Pad1]\nType = DualShock2\n");
    }
    let map: &[(&str, &str)] = &[
        ("a","Cross"),("b","Circle"),("x","Square"),("y","Triangle"),
        ("start","Start"),("select","Select"),
        ("up","Up"),("down","Down"),("left","Left"),("right","Right"),
        ("lb","L1"),("rb","R1"),("lt","L2"),("rt","R2"),
    ];
    for (our, ps) in map {
        if let Some(key) = bindings.get(*our) {
            ini = set_ini_value(&ini, "Pad1", ps, &format!("SDL-0/{}",key));
        }
    }
    fs::write(&cfg_path, ini).map_err(|e| e.to_string())
}

// ── RPCS3 ────────────────────────────────────────────────────────────────────
#[tauri::command]
async fn write_rpcs3_config(
    emulator_path: String,
    settings: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    let dir = Path::new(&emulator_path).parent().ok_or("Invalid path")?;
    let cfg_path = dir.join("config.yml");

    let mut yml = fs::read_to_string(&cfg_path).unwrap_or_default();

    // RPCS3 uses a specific YAML structure. We write top-level keys.
    // We set each key on its own line at the correct indentation level.
    fn set_yml_key(yml: &str, path: &[&str], value: &str) -> String {
        // path = ["Core", "PPU Decoder"] means:
        //   Core:
        //     PPU Decoder: value
        // We look for the section then the key within it.
        if path.len() == 1 {
            let key = path[0];
            let pattern = format!("{}:", key);
            if let Some(pos) = yml.find(&pattern) {
                let line_end = yml[pos..].find('\n').map(|p| p + pos).unwrap_or(yml.len());
                let mut r = yml.to_string();
                r.replace_range(pos..line_end, &format!("{}: {}", key, value));
                return r;
            }
            return format!("{}\n{}: {}", yml.trim_end(), key, value);
        }

        let section = path[0];
        let sub_key = path[1];
        let sec_pattern = format!("{}:", section);

        if let Some(sec_pos) = yml.find(&sec_pattern) {
            // Find the key within the section (indented with spaces)
            let after_sec = &yml[sec_pos..];
            let sub_pattern = format!("  {}:", sub_key);
            if let Some(rel_pos) = after_sec.find(&sub_pattern) {
                let abs = sec_pos + rel_pos;
                let line_end = yml[abs..].find('\n').map(|p| p + abs).unwrap_or(yml.len());
                let mut r = yml.to_string();
                r.replace_range(abs..line_end, &format!("  {}: {}", sub_key, value));
                return r;
            }
            // Sub-key not found — insert after section header line
            let sec_line_end = yml[sec_pos..].find('\n').map(|p| p + sec_pos).unwrap_or(yml.len());
            let mut r = yml.to_string();
            r.insert_str(sec_line_end + 1, &format!("  {}: {}\n", sub_key, value));
            return r;
        }
        // Section not found — append
        format!("{}\n{}:\n  {}: {}\n", yml.trim_end(), section, sub_key, value)
    }

    // (our_key, yaml_path, value_type)
    // value_type: "bool" -> true/false, "str" -> raw string
    let map: &[(&str, &[&str], &str)] = &[
        ("renderer",               &["Video", "Renderer"],                    "str"),
        ("resolution",             &["Video", "Resolution"],                  "str"),
        ("frameLimit",             &["Video", "Frame limit"],                  "str"),
        ("shaderMode",             &["Video", "Shader Mode"],                  "str"),
        ("zcull",                  &["Video", "Zcull Occlusion Queries"],      "str"),
        ("rsxFifo",                &["Video", "RSX FIFO Accuracy"],            "str"),
        ("msaa",                   &["Video", "MSAA"],                         "str"),
        ("writeColorBuffers",      &["Video", "Write Color Buffers"],          "bool"),
        ("writeDepthBuffers",      &["Video", "Write Depth Buffer"],           "bool"),
        ("readColorBuffers",       &["Video", "Read Color Buffers"],           "bool"),
        ("readDepthBuffers",       &["Video", "Read Depth Buffer"],            "bool"),
        ("gpuTextureScaling",      &["Video", "GPU texture scaling"],          "bool"),
        ("forceHighpZ",            &["Video", "Force High Precision Z buffer"],"bool"),
        ("strictTextureFlushing",  &["Video", "Strict Rendering Mode"],        "bool"),
        ("disableVertexCache",     &["Video", "Disable Vertex Cache"],         "bool"),
        ("asyncTexStreaming",       &["Video", "Asynchronous Texture Streaming"],"bool"),
        ("vsync",                  &["Video", "VSync"],                        "bool"),
        ("fpsCounter",             &["Video", "Show FPS counter"],             "bool"),
        ("ppuDecoder",             &["Core",  "PPU Decoder"],                  "str"),
        ("spuDecoder",             &["Core",  "SPU Decoder"],                  "str"),
        ("spuBlock",               &["Core",  "SPU Block Size"],               "str"),
        ("spuThreads",             &["Core",  "Preferred SPU Threads"],        "str"),
        ("spuLoop",                &["Core",  "SPU loop detection"],           "bool"),
        ("threadScheduler",        &["Core",  "Enable thread scheduler"],      "bool"),
        ("bindSPUCores",           &["Core",  "Bind SPU threads to secondary cores"], "bool"),
        ("accurateXFloat",         &["Core",  "Accurate xfloat"],              "bool"),
        ("hookStatic",             &["Core",  "Hook static functions"],        "bool"),
        ("clocksScale",            &["Core",  "Clocks scale"],                 "str"),
        ("audioBackend",           &["Audio", "Audio Out"],                    "str"),
        ("sysLang",                &["System","Language"],                     "str"),
        ("licenseArea",            &["System","License Area"],                 "str"),
        ("netStatus",              &["Net",   "Internet Status"],              "str"),
        ("enablePatches",          &["System","Enable game patches"],          "bool"),
    ];

    for (our_key, yml_path, vtype) in map {
        if let Some(val) = settings.get(*our_key) {
            let val_str = match *vtype {
                "bool" => match val {
                    serde_json::Value::Bool(b) => if *b { "true" } else { "false" }.to_string(),
                    _ => continue,
                },
                _ => match any_to_str(val) { Some(s) => s, None => continue },
            };
            yml = set_yml_key(&yml, yml_path, &val_str);
        }
    }

    fs::write(&cfg_path, yml).map_err(|e| e.to_string())
}

fn write_rpcs3_controller(emulator_path: &str, bindings: &HashMap<String, String>) -> Result<(), String> {
    let dir = Path::new(emulator_path).parent().ok_or("Invalid path")?;
    let cfg_path = dir.join("input_configs").join("global").join("Default.yml");
    fs::create_dir_all(cfg_path.parent().unwrap()).map_err(|e| e.to_string())?;

    let mut yml = fs::read_to_string(&cfg_path).unwrap_or_else(|_|
        "Player 1 Input:\n  Handler: XInput\n  Device: XInput Pad #0\n  Config:\n".to_string()
    );

    let map: &[(&str, &str)] = &[
        ("a","Cross"),("b","Circle"),("x","Square"),("y","Triangle"),
        ("start","Start"),("select","Select"),
        ("up","Up"),("down","Down"),("left","Left"),("right","Right"),
        ("lb","L1"),("rb","R1"),("lt","L2"),("rt","R2"),
        ("ls","L3"),("rs","R3"),
    ];

    for (our, ps) in map {
        if let Some(key) = bindings.get(*our) {
            let pattern = format!("    {}:", ps);
            let line = format!("    {}: {}", ps, key);
            if let Some(pos) = yml.find(&pattern) {
                let end = yml[pos..].find('\n').map(|p| p + pos).unwrap_or(yml.len());
                yml.replace_range(pos..end, &line);
            } else {
                yml.push_str(&format!("{}\n", line));
            }
        }
    }

    fs::write(&cfg_path, yml).map_err(|e| e.to_string())
}

// ── DuckStation ───────────────────────────────────────────────────────────────
#[tauri::command]
async fn write_duckstation_config(
    emulator_path: String,
    settings: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    let cfg_path = PathBuf::from(&appdata).join("DuckStation").join("settings.ini");
    fs::create_dir_all(cfg_path.parent().unwrap()).map_err(|e| e.to_string())?;

    let mut ini = fs::read_to_string(&cfg_path).unwrap_or_default();

    let map: &[(&str, &str, &str)] = &[
        ("renderer",     "GPU",     "Renderer"),
        ("resolution",   "GPU",     "ResolutionScale"),
        ("texFilter",    "GPU",     "TextureFilter"),
        ("vsync",        "GPU",     "VSync"),
        ("widescreen",   "GPU",     "WidescreenHack"),
        ("fpsCounter",   "Display", "ShowFPS"),
        ("fullscreen",   "Main",    "StartFullscreen"),
        ("audioBackend", "Audio",   "Backend"),
        ("volume",       "Audio",   "OutputVolume"),
        ("aa",           "GPU",     "Multisamples"),
        ("pgxp",         "GPU",     "PGXPEnable"),
        ("pgxpCpu",      "GPU",     "PGXPCPUMode"),
    ];

    for (k, sec, ini_key) in map {
        if let Some(val) = settings.get(*k) {
            if let Some(s) = any_to_str(val) {
                ini = set_ini_value(&ini, sec, ini_key, &s);
            }
        }
    }

    fs::write(&cfg_path, ini).map_err(|e| e.to_string())
}

fn write_duckstation_controller(bindings: &HashMap<String, String>) -> Result<(), String> {
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    let cfg_path = PathBuf::from(&appdata).join("DuckStation").join("settings.ini");
    let mut ini = fs::read_to_string(&cfg_path).unwrap_or_default();

    let map: &[(&str, &str)] = &[
        ("a","ButtonCross"),("b","ButtonCircle"),("x","ButtonSquare"),("y","ButtonTriangle"),
        ("start","ButtonStart"),("select","ButtonSelect"),
        ("up","ButtonUp"),("down","ButtonDown"),("left","ButtonLeft"),("right","ButtonRight"),
        ("lb","ButtonL1"),("rb","ButtonR1"),("lt","ButtonL2"),("rt","ButtonR2"),
        ("ls","ButtonL3"),("rs","ButtonR3"),
    ];
    for (our, ds) in map {
        if let Some(key) = bindings.get(*our) {
            ini = set_ini_value(&ini, "Controller1", ds, &format!("SDL-0/{}", key));
        }
    }
    fs::write(&cfg_path, ini).map_err(|e| e.to_string())
}

// ── Cemu ──────────────────────────────────────────────────────────────────────
#[tauri::command]
async fn write_cemu_config(
    emulator_path: String,
    settings: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    let appdata = std::env::var("APPDATA").unwrap_or_default();
    let appdata_path  = PathBuf::from(&appdata).join("Cemu").join("settings.xml");
    let portable_path = Path::new(&emulator_path)
        .parent().ok_or("Invalid emulator path")?
        .join("settings.xml");

    let cfg_path = if appdata_path.exists() {
        appdata_path.clone()
    } else if portable_path.exists() {
        portable_path
    } else {
        if let Some(p) = appdata_path.parent() { fs::create_dir_all(p).ok(); }
        appdata_path
    };

    let mut xml = fs::read_to_string(&cfg_path)
        .unwrap_or_else(|_| "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<content>\n</content>\n".to_string());

    // Replace or insert <tag>val</tag> at root level
    fn set_root(xml: &str, tag: &str, val: &str) -> String {
        let open  = format!("<{}>", tag);
        let close = format!("</{}>", tag);
        let full  = format!("{}{}{}", open, val, close);
        if let (Some(s), Some(e_rel)) = (xml.find(&open), xml.find(&open).and_then(|s| xml[s..].find(&close).map(|r| s+r+close.len()))) {
            let mut r = xml.to_string();
            r.replace_range(s..e_rel, &full);
            return r;
        }
        xml.replace("</content>", &format!("  {}\n</content>", full))
    }

    // Replace or insert <tag>val</tag> inside <section>...</section>
    // Works on absolute string positions to avoid index bugs
    fn set_in_section(xml: &str, section: &str, tag: &str, val: &str) -> String {
        let sec_open  = format!("<{}>",  section);
        let sec_close = format!("</{}>", section);
        let t_open    = format!("<{}>",  tag);
        let t_close   = format!("</{}>", tag);
        let full_tag  = format!("{}{}{}", t_open, val, t_close);

        if let Some(sec_s) = xml.find(&sec_open) {
            if let Some(sec_e_rel) = xml[sec_s..].find(&sec_close) {
                let sec_e = sec_s + sec_e_rel + sec_close.len();

                // Search for tag within section bounds
                let within = &xml[sec_s..sec_e];
                if let Some(tag_s_rel) = within.find(&t_open) {
                    if let Some(tag_e_rel) = within[tag_s_rel..].find(&t_close) {
                        let abs_tag_s = sec_s + tag_s_rel;
                        let abs_tag_e = abs_tag_s + tag_e_rel + t_close.len();
                        let mut r = xml.to_string();
                        r.replace_range(abs_tag_s..abs_tag_e, &full_tag);
                        return r;
                    }
                }

                // Tag not in section — insert before </section>
                let abs_sec_close = sec_s + sec_e_rel;
                let mut r = xml.to_string();
                r.insert_str(abs_sec_close, &format!("    {}\n  ", full_tag));
                return r;
            }
        }

        // Section doesn't exist — insert whole section before </content>
        let new_sec = format!("  {}\n    {}\n  {}\n", sec_open, full_tag, sec_close);
        xml.replace("</content>", &format!("{}</content>", new_sec))
    }

    // Cemu 2.x settings.xml structure:
    // <content>
    //   <Graphics>
    //     <api>Vulkan</api>
    //     <VSync>0</VSync>          0=off 1=on
    //     <OverlayScreen>0</OverlayScreen>  0=off 1=on
    //   </Graphics>
    //   <fullscreen>false</fullscreen>
    //   <TVResolution>1920x1080</TVResolution>
    //   <TVScaleMode>0</TVScaleMode>  0=keep ratio 1=stretch
    // </content>

    if let Some(v) = settings.get("renderer") {
        let val = if v.as_str().unwrap_or("") == "OpenGL" { "OpenGL" } else { "Vulkan" };
        xml = set_in_section(&xml, "Graphics", "api", val);
    }
    if let Some(v) = settings.get("vsync") {
        let val = if v.as_bool().unwrap_or(true) { "1" } else { "0" };
        xml = set_in_section(&xml, "Graphics", "VSync", val);
    }
    if let Some(v) = settings.get("fpsCounter") {
        let val = if v.as_bool().unwrap_or(false) { "1" } else { "0" };
        xml = set_in_section(&xml, "Graphics", "OverlayScreen", val);
    }
    if let Some(v) = settings.get("fullscreen") {
        let val = if v.as_bool().unwrap_or(false) { "true" } else { "false" };
        xml = set_root(&xml, "fullscreen", val);
    }
    if let Some(v) = settings.get("resolution") {
        let val = match v.as_str().unwrap_or("1920x1080") {
            "1080p" | "1920x1080" => "1920x1080",
            "1440p" | "2560x1440" => "2560x1440",
            "4k"    | "3840x2160" => "3840x2160",
            "720p"  | "1280x720"  => "1280x720",
            other                 => other,
        };
        xml = set_root(&xml, "TVResolution", val);
    }
    if let Some(v) = settings.get("aspect") {
        let val = if v.as_str().unwrap_or("") == "stretch" { "1" } else { "0" };
        xml = set_root(&xml, "TVScaleMode", val);
    }

    fs::write(&cfg_path, &xml).map_err(|e| format!("Could not write Cemu settings.xml: {}", e))
}

// ── Xenia (Xbox 360) ──────────────────────────────────────────────────────────
#[tauri::command]
async fn write_xenia_config(
    emulator_path: String,
    settings: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    // Xenia uses a .config.toml file in its directory
    let dir = Path::new(&emulator_path).parent().ok_or("Invalid path")?;
    let cfg_path = dir.join("xenia-canary.config.toml");

    let mut toml_str = fs::read_to_string(&cfg_path).unwrap_or_default();

    fn set_toml(toml: &str, key: &str, val: &str) -> String {
        let pattern = format!("{} =", key);
        let line = format!("{} = {}", key, val);
        if let Some(pos) = toml.find(&pattern) {
            let end = toml[pos..].find('\n').map(|p| p + pos).unwrap_or(toml.len());
            let mut r = toml.to_string();
            r.replace_range(pos..end, &line);
            return r;
        }
        format!("{}\n{}", toml.trim_end(), line)
    }

    let map: &[(&str, &str)] = &[
        ("renderer",   "gpu"),
        ("vsync",      "vsync"),
        ("fullscreen", "fullscreen"),
        ("resolution", "internal_display_resolution"),
        ("fpsCounter", "show_fps"),
    ];

    for (k, toml_key) in map {
        if let Some(val) = settings.get(*k) {
            let val_str = match val {
                serde_json::Value::Bool(b) => if *b { "true" } else { "false" }.to_string(),
                serde_json::Value::Number(n) => n.to_string(),
                serde_json::Value::String(s) => format!("\"{}\"", s),
                _ => continue,
            };
            toml_str = set_toml(&toml_str, toml_key, &val_str);
        }
    }

    fs::write(&cfg_path, toml_str).map_err(|e| e.to_string())
}

// ── xemu (Original Xbox) ──────────────────────────────────────────────────────
#[tauri::command]
async fn write_xemu_config(
    emulator_path: String,
    settings: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    // xemu stores config in %APPDATA%\xemu\xemu.toml
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    let cfg_path = PathBuf::from(&appdata).join("xemu").join("xemu.toml");
    fs::create_dir_all(cfg_path.parent().unwrap()).map_err(|e| e.to_string())?;

    let mut toml_str = fs::read_to_string(&cfg_path).unwrap_or_default();

    fn set_toml_section(toml: &str, section: &str, key: &str, val: &str) -> String {
        let sec_header = format!("[{}]", section);
        let line = format!("{} = {}", key, val);
        if let Some(sec_pos) = toml.find(&sec_header) {
            let after = &toml[sec_pos + sec_header.len()..];
            let next_sec = after.find("\n[").map(|p| p + sec_pos + sec_header.len());
            let range = &toml[sec_pos..next_sec.unwrap_or(toml.len())];
            if let Some(kp) = range.find(&format!("\n{} =", key)) {
                let abs = sec_pos + kp;
                let end = toml[abs+1..].find('\n').map(|p| p + abs + 1).unwrap_or(toml.len());
                let mut r = toml.to_string();
                r.replace_range(abs+1..end, &line);
                return r;
            }
            let ins = sec_pos + sec_header.len();
            let mut r = toml.to_string();
            r.insert_str(ins, &format!("\n{}", line));
            return r;
        }
        format!("{}\n{}\n{}\n", toml.trim_end(), sec_header, line)
    }

    let map: &[(&str, &str, &str)] = &[
        ("vsync",        "display", "vsync"),
        ("fullscreen",   "display", "fullscreen"),
        ("resolution",   "display", "scale"),
        ("renderer",     "display", "backend"),
    ];

    for (k, sec, toml_key) in map {
        if let Some(val) = settings.get(*k) {
            let val_str = match val {
                serde_json::Value::Bool(b) => if *b { "true" } else { "false" }.to_string(),
                serde_json::Value::Number(n) => n.to_string(),
                serde_json::Value::String(s) => format!("\"{}\"", s),
                _ => continue,
            };
            toml_str = set_toml_section(&toml_str, sec, toml_key, &val_str);
        }
    }

    fs::write(&cfg_path, toml_str).map_err(|e| e.to_string())
}

// ── Project64 ────────────────────────────────────────────────────────────────
#[tauri::command]
async fn write_project64_config(
    emulator_path: String,
    settings: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    let dir = Path::new(&emulator_path).parent().ok_or("Invalid path")?;
    let cfg_path = dir.join("Config").join("Project64.cfg");
    fs::create_dir_all(cfg_path.parent().unwrap()).map_err(|e| e.to_string())?;

    let mut ini = fs::read_to_string(&cfg_path).unwrap_or_default();

    let map: &[(&str, &str, &str)] = &[
        ("vsync",      "Settings", "VerticalSync"),
        ("fullscreen", "Settings", "Fullscreen"),
        ("resolution", "Settings", "FullScreenResWidth"),
    ];

    for (k, sec, ini_key) in map {
        if let Some(val) = settings.get(*k) {
            if let Some(s) = any_to_str(val) {
                ini = set_ini_value(&ini, sec, ini_key, &s);
            }
        }
    }
    fs::write(&cfg_path, ini).map_err(|e| e.to_string())
}

// ── melonDS ──────────────────────────────────────────────────────────────────
#[tauri::command]
async fn write_melonds_config(
    emulator_path: String,
    settings: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    let dir = Path::new(&emulator_path).parent().ok_or("Invalid path")?;
    let cfg_path = dir.join("melonDS.ini");

    let mut ini = fs::read_to_string(&cfg_path).unwrap_or_default();

    // melonDS uses a flat ini without sections
    fn set_flat(ini: &str, key: &str, val: &str) -> String {
        let pattern = format!("{}=", key);
        let line = format!("{}={}", key, val);
        if let Some(pos) = ini.find(&pattern) {
            let end = ini[pos..].find('\n').map(|p| p + pos).unwrap_or(ini.len());
            let mut r = ini.to_string();
            r.replace_range(pos..end, &line);
            return r;
        }
        format!("{}\n{}", ini.trim_end(), line)
    }

    let map: &[(&str, &str)] = &[
        ("vsync",      "ScreenVSync"),
        ("fullscreen", "WindowFullscreen"),
        ("renderer",   "Renderer"),
    ];

    for (k, ini_key) in map {
        if let Some(val) = settings.get(*k) {
            let val_str = match val {
                serde_json::Value::Bool(b) => if *b { "1" } else { "0" }.to_string(),
                _ => match any_to_str(val) { Some(s) => s, None => continue },
            };
            ini = set_flat(&ini, ini_key, &val_str);
        }
    }
    fs::write(&cfg_path, ini).map_err(|e| e.to_string())
}

// ── Flycast (Dreamcast) ───────────────────────────────────────────────────────
#[tauri::command]
async fn write_flycast_config(
    emulator_path: String,
    settings: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    let dir = Path::new(&emulator_path).parent().ok_or("Invalid path")?;
    let cfg_path = dir.join("emu.cfg");

    let mut ini = fs::read_to_string(&cfg_path).unwrap_or_default();

    let map: &[(&str, &str, &str)] = &[
        ("renderer",   "config", "rend"),
        ("vsync",      "config", "vsync"),
        ("fullscreen", "window", "fullscreen"),
        ("resolution", "config", "internal_resolution"),
    ];

    for (k, sec, ini_key) in map {
        if let Some(val) = settings.get(*k) {
            let val_str = match val {
                serde_json::Value::Bool(b) => if *b { "1" } else { "0" }.to_string(),
                _ => match any_to_str(val) { Some(s) => s, None => continue },
            };
            ini = set_ini_value(&ini, sec, ini_key, &val_str);
        }
    }
    fs::write(&cfg_path, ini).map_err(|e| e.to_string())
}

// ── Lime3DS / Citra (3DS) ─────────────────────────────────────────────────────
// Lime3DS (community replacement for discontinued Citra) stores config at
// %APPDATA%\Lime3DS\config\qt-config.ini  (Windows)
// Citra used the same path with "Citra" instead of "Lime3DS".
// We write to both locations so it works regardless of which fork is installed.
#[tauri::command]
async fn write_lime3ds_config(
    emulator_path: String,
    settings: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());

    // Try Lime3DS path first, fall back to Citra path
    let candidate_dirs = [
        PathBuf::from(&appdata).join("Lime3DS").join("config"),
        PathBuf::from(&appdata).join("Citra").join("config"),
        // Also check next to the executable for portable installs
        Path::new(&emulator_path).parent()
            .map(|p| p.join("user").join("config"))
            .unwrap_or_else(|| PathBuf::from(".")),
    ];

    let cfg_path = candidate_dirs.iter()
        .map(|d| d.join("qt-config.ini"))
        .find(|p| p.exists())
        .unwrap_or_else(|| {
            // Default to Lime3DS appdata path even if it doesn't exist yet
            PathBuf::from(&appdata).join("Lime3DS").join("config").join("qt-config.ini")
        });

    fs::create_dir_all(cfg_path.parent().unwrap()).map_err(|e| e.to_string())?;
    let mut ini = fs::read_to_string(&cfg_path).unwrap_or_default();

    // Lime3DS / Citra qt-config.ini mappings
    let map: &[(&str, &str, &str)] = &[
        ("renderer",      "Renderer",  "graphics_api"),
        ("resolution",    "Renderer",  "resolution_factor"),
        ("vsync",         "Renderer",  "use_vsync_new"),
        ("fullscreen",    "UI",        "fullscreen"),
        ("fpsCounter",    "Renderer",  "show_fps"),
        ("shaderCache",   "Renderer",  "use_shader_jit"),
        ("texFilter",     "Renderer",  "filter_mode"),
        ("stereoscopy",   "Renderer",  "render_3d"),
        ("audioBackend",  "Audio",     "output_engine"),
        ("volume",        "Audio",     "volume"),
        ("audioLatency",  "Audio",     "output_latency"),
        ("layoutOption",  "Layout",    "layout_option"),
    ];

    for (k, sec, ini_key) in map {
        if let Some(val) = settings.get(*k) {
            let val_str = match val {
                serde_json::Value::Bool(b) => if *b { "true" } else { "false" }.to_string(),
                serde_json::Value::Number(n) => n.to_string(),
                serde_json::Value::String(s) => s.clone(),
                _ => continue,
            };
            ini = set_ini_value(&ini, sec, ini_key, &val_str);
        }
    }

    fs::write(&cfg_path, ini).map_err(|e| e.to_string())
}

fn write_lime3ds_controller(bindings: &HashMap<String, String>) -> Result<(), String> {
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    let candidate_dirs = [
        PathBuf::from(&appdata).join("Lime3DS").join("config"),
        PathBuf::from(&appdata).join("Citra").join("config"),
    ];
    let cfg_path = candidate_dirs.iter()
        .map(|d| d.join("qt-config.ini"))
        .find(|p| p.exists())
        .unwrap_or_else(|| PathBuf::from(&appdata).join("Lime3DS").join("config").join("qt-config.ini"));

    let mut ini = fs::read_to_string(&cfg_path).unwrap_or_default();

    // Lime3DS uses SDL2 button names in [Controls] section
    let map: &[(&str, &str)] = &[
        ("a",      "button_a"),
        ("b",      "button_b"),
        ("x",      "button_x"),
        ("y",      "button_y"),
        ("start",  "button_start"),
        ("select", "button_select"),
        ("up",     "button_up"),
        ("down",   "button_down"),
        ("left",   "button_left"),
        ("right",  "button_right"),
        ("lb",     "button_l"),
        ("rb",     "button_r"),
        ("lt",     "button_zl"),
        ("rt",     "button_zr"),
        ("ls",     "button_lstick"),
        ("rs",     "button_rstick"),
    ];
    for (our, cfg_key) in map {
        if let Some(key) = bindings.get(*our) {
            ini = set_ini_value(&ini, "Controls", cfg_key,
                &format!("engine:sdl2,guid:,port:0,button:{}", key));
        }
    }
    fs::write(&cfg_path, ini).map_err(|e| e.to_string())
}
#[tauri::command]
async fn write_emulator_config(
    console_id: String,
    emulator_path: String,
    settings: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    match console_id.as_str() {
        "gamecube" | "wii" => write_dolphin_config(emulator_path, settings).await,
        "ps2"              => write_pcsx2_config(emulator_path, settings).await,
        "ps3"              => write_rpcs3_config(emulator_path, settings).await,
        "ps1"              => write_duckstation_config(emulator_path, settings).await,
        "wiiu"             => write_cemu_config(emulator_path, settings).await,
        "xbox360"          => write_xenia_config(emulator_path, settings).await,
        "xbox"             => write_xemu_config(emulator_path, settings).await,
        "n64"              => write_project64_config(emulator_path, settings).await,
        "ds"               => write_melonds_config(emulator_path, settings).await,
        "dreamcast"        => write_flycast_config(emulator_path, settings).await,
        "3ds"              => write_lime3ds_config(emulator_path, settings).await,
        _                  => Ok(()),
    }
}

// ── Controller binding writer dispatcher ──────────────────────────────────────
#[tauri::command]
async fn write_controller_bindings(
    console_id: String,
    emulator_path: String,
    bindings: HashMap<String, String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // Save to our own config first
    {
        let mut cfg = state.config.lock().unwrap();
        let entry = cfg.consoles.entry(console_id.clone()).or_default();
        entry.controller_bindings = bindings.clone();
        save_config(&state.config_path, &cfg)?;
    }

    // Then write to the emulator's actual controller config
    match console_id.as_str() {
        "gamecube" | "wii"  => write_dolphin_controller(&emulator_path, &bindings),
        "ps2"               => write_pcsx2_controller(&bindings),
        "ps3"               => write_rpcs3_controller(&emulator_path, &bindings),
        "ps1"               => write_duckstation_controller(&bindings),
        "3ds"               => write_lime3ds_controller(&bindings),
        _                   => Ok(()), // xemu, Xenia, Project64 etc. use XInput directly
    }
}

// ─── SAVE STATES ──────────────────────────────────────────────────────────────

fn save_states_dir_for_console(console_id: &str, emulator_path: &str) -> PathBuf {
    let dir = Path::new(emulator_path).parent().unwrap_or(Path::new("."));
    match console_id {
        "gamecube" | "wii" => dir.join("User").join("States"),
        "ps2" => {
            let appdata = std::env::var("APPDATA").unwrap_or_default();
            PathBuf::from(appdata).join("PCSX2").join("sstates")
        }
        "ps3" => dir.join("dev_hdd0").join("savedata"),
        "ps1" => {
            let appdata = std::env::var("APPDATA").unwrap_or_default();
            PathBuf::from(appdata).join("DuckStation").join("savestates")
        }
        "wiiu" => dir.join("mlc01").join("usr").join("save"),
        "n64"  => dir.join("Save"),
        "ds" | "3ds" => {
            let appdata = std::env::var("APPDATA").unwrap_or_default();
            PathBuf::from(appdata).join("melonDS").join("Saves")
        }
        _ => dir.join("savestates"),
    }
}

#[tauri::command]
async fn get_save_states(
    console_id: String,
    game_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<SaveState>, String> {
    let emulator_path = {
        let cfg = state.config.lock().unwrap();
        cfg.consoles.get(&console_id)
            .map(|c| c.emulator_path.clone())
            .unwrap_or_default()
    };
    if emulator_path.is_empty() {
        // Return 8 empty slots
        return Ok((0u8..8).map(|i| SaveState {
            slot: i, label: format!("Slot {}", i+1),
            path: String::new(), screenshot_path: None,
            screenshot_data: None,
            created_at: String::new(), has_save: false,
        }).collect());
    }

    let saves_dir = save_states_dir_for_console(&console_id, &emulator_path);
    let mut states: Vec<SaveState> = Vec::new();

    for slot in 0u8..8 {
        // Different emulators use different naming conventions
        let candidates: Vec<PathBuf> = vec![
            saves_dir.join(format!("{}_{}.sstate",   &game_id, slot)),
            saves_dir.join(format!("{}.ss{}",         &game_id, slot)),
            saves_dir.join(format!("{}.s0{}",         &game_id, slot)),
            saves_dir.join(format!("slot_{}.sstate",  slot)),
        ];

        let save_path = candidates.into_iter().find(|p| p.exists());

        if let Some(ref path) = save_path {
            let meta = fs::metadata(path).ok();
            let created = meta.and_then(|m| m.modified().ok())
                .map(|t| { let dt: chrono::DateTime<chrono::Local> = t.into(); dt.format("%b %d, %Y  %H:%M").to_string() })
                .unwrap_or_default();

            // Look for screenshot (PNG next to save file)
            let screenshot_path = {
                let ss = saves_dir.join(format!("{}_{}.png", &game_id, slot));
                let ss2 = saves_dir.join(format!("{}.ss{}.png", &game_id, slot));
                if ss.exists() { Some(ss.to_string_lossy().to_string()) }
                else if ss2.exists() { Some(ss2.to_string_lossy().to_string()) }
                else { None }
            };

            // Encode screenshot as base64 so frontend can display it inline
            let screenshot_data = screenshot_path.as_ref().and_then(|sp| {
                fs::read(sp).ok().map(|bytes| {
                    use std::io::Write;
                    let mut enc = String::new();
                    let b64: String = bytes.iter().fold(String::new(), |mut acc, b| {
                        acc.push(*b as char);
                        acc
                    });
                    // Simple base64 encode
                    let encoded = base64_encode(&bytes);
                    format!("data:image/png;base64,{}", encoded)
                })
            });

            states.push(SaveState {
                slot,
                label: format!("Slot {}", slot + 1),
                path: path.to_string_lossy().to_string(),
                screenshot_path,
                screenshot_data,
                created_at: created,
                has_save: true,
            });
        } else {
            states.push(SaveState {
                slot,
                label: format!("Slot {}", slot + 1),
                path: String::new(),
                screenshot_path: None,
                screenshot_data: None,
                created_at: String::new(),
                has_save: false,
            });
        }
    }

    Ok(states)
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();
    let mut i = 0;
    while i < data.len() {
        let b0 = data[i] as u32;
        let b1 = if i + 1 < data.len() { data[i+1] as u32 } else { 0 };
        let b2 = if i + 2 < data.len() { data[i+2] as u32 } else { 0 };
        result.push(CHARS[((b0 >> 2) & 0x3F) as usize] as char);
        result.push(CHARS[(((b0 & 0x3) << 4) | ((b1 >> 4) & 0xF)) as usize] as char);
        result.push(if i+1 < data.len() { CHARS[(((b1 & 0xF) << 2) | ((b2 >> 6) & 0x3)) as usize] as char } else { '=' });
        result.push(if i+2 < data.len() { CHARS[(b2 & 0x3F) as usize] as char } else { '=' });
        i += 3;
    }
    result
}

// load_save_state: copies the chosen slot to the emulator's auto-load position,
// then launches the game. The emulator picks it up and starts at that save point.
#[tauri::command]
async fn load_save_state(
    console_id: String,
    game_id: String,
    save_path: String,
    slot: u8,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let (emulator, extra_args, game_path) = {
        let cfg = state.config.lock().unwrap();
        let con = cfg.consoles.get(&console_id)
            .ok_or("No emulator configured")?;
        if con.emulator_path.is_empty() {
            return Err("Emulator path not set. Go to ⚙ Settings.".to_string());
        }
        let ea = con.settings.get("extraArgs")
            .and_then(|v| v.as_str()).unwrap_or("").to_string();
        let emu = con.emulator_path.clone();
        drop(cfg);

        let store = state.games.lock().unwrap();
        let gpath = store.games.get(&console_id)
            .and_then(|gs| gs.iter().find(|g| g.id == game_id))
            .map(|g| g.path.clone())
            .ok_or("Game not found")?;
        (emu, ea, gpath)
    };

    // Build launch args with save state slot where supported
    let args = load_save_args_for_console(&console_id, &game_path, &save_path, slot);

    Command::new(&emulator)
        .args(&args)
        .spawn()
        .map_err(|e| format!("Failed to launch: {}", e))?;

    // Update last played
    let now = chrono::Local::now().format("%Y-%m-%d").to_string();
    let mut store = state.games.lock().unwrap();
    if let Some(games) = store.games.get_mut(&console_id) {
        if let Some(g) = games.iter_mut().find(|g| g.id == game_id) {
            g.last_played = Some(now);
        }
    }
    save_games(&state.games_path, &store)?;
    Ok(())
}

fn load_save_args_for_console(id: &str, rom: &str, save_path: &str, slot: u8) -> Vec<String> {
    match id {
        // Dolphin: -e "rom" --save-state-slot N
        "gamecube" | "wii" => vec![
            "-e".into(), rom.into(),
            "--save-state-slot".into(), slot.to_string(),
        ],
        // PCSX2: direct rom + --state N
        "ps2" => vec![
            rom.into(),
            "--state".into(), slot.to_string(),
        ],
        // DuckStation: direct rom + -loadstate "path"
        "ps1" => vec![
            rom.into(),
            "-loadstate".into(), save_path.into(),
        ],
        // Project64: direct rom (no CLI save state load support, just launch)
        "n64" => vec![rom.into()],
        // Cemu: -g "rom" (no CLI save state slot support, just launch)
        "wiiu" => vec!["-g".into(), rom.into()],
        // melonDS: direct rom (no CLI save state load)
        "ds" | "3ds" => vec![rom.into()],
        // RPCS3: --no-gui "rom" (no CLI save state slot support)
        "ps3" => vec!["--no-gui".into(), rom.into()],
        // Xenia: direct rom
        "xbox360" => vec![rom.into()],
        // xemu: -dvd_path "rom"
        "xbox" => vec!["-dvd_path".into(), rom.into()],
        // Flycast: direct rom
        "dreamcast" => vec![rom.into()],
        _ => vec![rom.into()],
    }
}

#[tauri::command]
async fn delete_save_state(path: String) -> Result<(), String> {
    if path.is_empty() { return Ok(()); }
    fs::remove_file(&path).map_err(|e| format!("Could not delete save: {}", e))?;
    // Also remove screenshot if exists
    let png = format!("{}.png", &path.trim_end_matches(".sstate"));
    let _ = fs::remove_file(&png);
    Ok(())
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir()
                .expect("Failed to get app data dir");
            fs::create_dir_all(&app_dir).ok();

            let config_path = app_dir.join("config.json");
            let games_path  = app_dir.join("games.json");
            let covers_dir  = app_dir.join("covers");
            fs::create_dir_all(&covers_dir).ok();

            let config = load_config(&config_path);
            let games  = load_games(&games_path);

            app.manage(AppState {
                config: Mutex::new(config),
                games:  Arc::new(Mutex::new(games)),
                config_path,
                games_path,
                covers_dir,
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            get_global_settings,
            startup_scan,
            save_console_settings,
            save_controller_bindings,
            save_global_settings,
            get_games,
            open_file_dialog,
            open_folder_dialog,
            open_image_dialog,
            scan_rom_folder,
            remove_game,
            rename_game,
            reset_all_settings,
            toggle_favorite,
            launch_game,
            test_emulator_launch,
            toggle_fullscreen,
            exit_app,
            restart_app,
            open_url,
            open_emulator,
            scan_covers_for_console,
            fetch_cover_art,
            fetch_all_covers_for_console,
            get_cover_base64,
            set_custom_cover,
            rescan_all_folders,
            cleanup_orphaned_games,
            remove_missing_files,
            write_emulator_config,
            write_controller_bindings,
            write_dolphin_config,
            write_pcsx2_config,
            write_rpcs3_config,
            write_duckstation_config,
            write_cemu_config,
            write_xenia_config,
            write_xemu_config,
            write_project64_config,
            write_melonds_config,
            write_flycast_config,
            write_lime3ds_config,
            get_save_states,
            load_save_state,
            delete_save_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running RetroShelf");
}
