
import importlib.util
import subprocess
import sys

def check_dependencies():
    """Check if required Python packages are installed."""
    required_packages = [
        "msal",
        "python-dateutil", 
        "pandas",
        "numpy",
        "pyodbc"
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
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--force-reinstall", "pandas"])
                print("Successfully reinstalled numpy and pandas")
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
