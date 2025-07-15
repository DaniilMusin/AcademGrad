#!/usr/bin/env python3
"""
Cleanup script for removing temporary files and build artifacts.
Helps maintain a clean development environment.
"""

import os
import shutil
import glob
import sys

def cleanup_temp_files():
    """Remove temporary files and build artifacts."""
    
    cleanup_patterns = [
        # Python artifacts
        "**/__pycache__",
        "**/*.pyc", 
        "**/*.pyo",
        "**/*.pyd",
        "**/.pytest_cache",
        "**/dist",
        "**/build",
        "**/*.egg-info",
        
        # Node.js artifacts  
        "**/node_modules/.cache",
        "**/.next",
        "**/dist",
        "**/coverage",
        
        # Editor artifacts
        "**/.vscode/settings.json",
        "**/*.swp",
        "**/*.swo",
        "**/*~",
        
        # OS artifacts
        "**/.DS_Store",
        "**/Thumbs.db",
        
        # Logs
        "**/*.log",
        "**/logs",
        
        # Temporary databases
        "**/*.db-journal",
        "**/temp.db",
        "**/test.db"
    ]
    
    removed_count = 0
    removed_size = 0
    
    print("🧹 Cleaning up temporary files...")
    
    for pattern in cleanup_patterns:
        matches = glob.glob(pattern, recursive=True)
        
        for match in matches:
            try:
                if os.path.isfile(match):
                    size = os.path.getsize(match)
                    os.remove(match)
                    removed_count += 1
                    removed_size += size
                    print(f"  ✓ Removed file: {match}")
                    
                elif os.path.isdir(match):
                    # Calculate directory size before removal
                    for root, dirs, files in os.walk(match):
                        for file in files:
                            try:
                                removed_size += os.path.getsize(os.path.join(root, file))
                            except:
                                pass
                    
                    shutil.rmtree(match)
                    removed_count += 1
                    print(f"  ✓ Removed directory: {match}")
                    
            except Exception as e:
                print(f"  ⚠️  Could not remove {match}: {e}")
    
    # Clean up empty directories
    empty_dirs = []
    for root, dirs, files in os.walk('.'):
        if not dirs and not files and root != '.':
            empty_dirs.append(root)
    
    for empty_dir in empty_dirs:
        try:
            os.rmdir(empty_dir)
            print(f"  ✓ Removed empty directory: {empty_dir}")
        except:
            pass
    
    size_mb = removed_size / (1024 * 1024)
    print(f"\n✨ Cleanup complete!")
    print(f"   Removed {removed_count} items")
    print(f"   Freed {size_mb:.2f} MB of disk space")

def reset_development_environment():
    """Reset development environment to clean state."""
    
    print("🔄 Resetting development environment...")
    
    # Stop any running processes
    print("  Stopping development servers...")
    os.system("pkill -f 'npm run dev' 2>/dev/null || true")
    os.system("pkill -f 'supabase' 2>/dev/null || true")
    
    # Clean up temporary files
    cleanup_temp_files()
    
    # Reset git if needed
    if os.path.exists('.git'):
        print("  Cleaning git repository...")
        os.system("git clean -fd")
        os.system("git reset --hard")
    
    print("✅ Development environment reset complete!")

def main():
    """Main function with command line options."""
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--reset":
            reset_development_environment()
        elif sys.argv[1] == "--help":
            print("Usage:")
            print("  python cleanup.py          # Clean temporary files")
            print("  python cleanup.py --reset  # Full development environment reset")
            print("  python cleanup.py --help   # Show this help")
        else:
            print("Unknown option. Use --help for usage information.")
    else:
        cleanup_temp_files()

if __name__ == "__main__":
    main()