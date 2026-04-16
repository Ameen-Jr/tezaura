#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::sync::{Arc, Mutex};
use tauri::Manager;

fn main() {
    // Shared handle so we can kill the backend when the app exits
    let child_handle: Arc<Mutex<Option<std::process::Child>>> = Arc::new(Mutex::new(None));
    let child_for_exit = child_handle.clone();

    tauri::Builder::default()
        .setup(move |app| {
            let backend_path = app
                .path()
                .resource_dir()
                .expect("Could not resolve resource directory")
                .join("binaries")
                .join("tezaura-backend.exe");

            let child = Command::new(&backend_path)
                .spawn()
                .expect("Failed to start tezaura-backend");

            // Store handle so exit handler can kill it
            *child_handle.lock().unwrap() = Some(child);
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(move |_app_handle, event| {
            // Kill Python backend cleanly when the window is closed
            if let tauri::RunEvent::Exit = event {
                if let Ok(mut guard) = child_for_exit.lock() {
                    if let Some(ref mut child) = *guard {
                        let _ = child.kill();
                    }
                }
            }
        });
}