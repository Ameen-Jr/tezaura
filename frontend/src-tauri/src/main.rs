#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::sync::{Arc, Mutex};
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Opens a URL in the system's default browser (called from React via invoke)
#[tauri::command]
fn open_url(url: String) {
    let _ = Command::new("cmd")
        .args(["/C", "start", "", &url])
        .creation_flags(CREATE_NO_WINDOW)
        .spawn();
}

fn main() {
    let child_handle: Arc<Mutex<Option<std::process::Child>>> = Arc::new(Mutex::new(None));
    let child_for_exit = child_handle.clone();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_url])
        .setup(move |app| {
            let exe_dir = std::env::current_exe()
                .expect("Cannot get exe path")
                .parent()
                .expect("Cannot get exe directory")
                .to_path_buf();

            let backend_path = exe_dir.join("tezaura-backend.exe");

            match Command::new(&backend_path)
                .creation_flags(CREATE_NO_WINDOW)
                .spawn()
            {
                Ok(child) => { *child_handle.lock().unwrap() = Some(child); }
                Err(e) => { eprintln!("Backend spawn error: {} | path: {:?}", e, backend_path); }
            }

            let _ = app;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(move |_app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                if let Ok(mut guard) = child_for_exit.lock() {
                    if let Some(ref mut child) = *guard {
                        let _ = child.kill();
                    }
                }
            }
        });
}