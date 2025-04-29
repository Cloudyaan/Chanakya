
from flask import Blueprint

update_bp = Blueprint('update', __name__, url_prefix='/api')
updates_bp = Blueprint('updates', __name__)  # Add this line to define the updates_bp

# Import all route handlers
from .updates import get_updates, trigger_fetch_updates
from .windows_updates import get_windows_updates, trigger_fetch_windows_updates

# Register routes with the blueprint
# The routes are already registered in their respective modules
