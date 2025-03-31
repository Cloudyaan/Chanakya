
import importlib.util
import subprocess
import sys
import os

def check_dependencies():
    """Check if required Python packages are installed."""
    required_packages = [
        "msal",
        "python-dateutil"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        spec = importlib.util.find_spec(package)
        if spec is None:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"Warning: Missing required packages: {', '.join(missing_packages)}")
        print("Installing missing packages...")
        
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing_packages)
            print("Successfully installed missing packages")
            return True
        except Exception as e:
            print(f"Failed to install missing packages: {e}")
            return False
    
    return True

def check_numpy_pandas_compatibility():
    """Check if numpy and pandas are compatible."""
    try:
        # Try importing pandas to check compatibility
        import pandas as pd
        return True
    except ValueError as e:
        if "numpy.dtype size changed" in str(e):
            print("NumPy and pandas version incompatibility detected.")
            print("Attempting to fix by reinstalling numpy and pandas...")
            try:
                # Reinstall numpy first, then pandas
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--force-reinstall", "numpy"])
                
                # Force a restart of the application on macOS or Linux after reinstalling numpy
                if os.name != 'nt':  # Not Windows
                    print("Forcing application restart after numpy reinstall")
                    os.execv(sys.executable, ['python'] + sys.argv)
                
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--force-reinstall", "pandas"])
                print("Successfully reinstalled numpy and pandas")
                
                # Force a restart of the application
                if os.name != 'nt':  # Not Windows
                    print("Forcing application restart after reinstalling packages")
                    os.execv(sys.executable, ['python'] + sys.argv)
                
                return True
            except Exception as install_error:
                print(f"Failed to fix numpy/pandas compatibility: {install_error}")
                return False
        else:
            print(f"Unexpected error when importing pandas: {e}")
            return False
    except Exception as e:
        print(f"Error importing pandas: {e}")
        return False

def fix_pandas_numpy_compatibility():
    """Fix pandas and numpy compatibility issues by reinstalling both packages."""
    try:
        print("Attempting to fix pandas/numpy compatibility by reinstalling...")
        # Force reinstall numpy first
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--force-reinstall", "numpy"])
        # Then reinstall pandas
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--force-reinstall", "pandas"])
        print("Successfully reinstalled numpy and pandas")
        return True
    except Exception as e:
        print(f"Failed to reinstall numpy and pandas: {e}")
        return False
