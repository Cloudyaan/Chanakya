
from flask import Blueprint

update_bp = Blueprint('update', __name__, url_prefix='/api')
updates_bp = Blueprint('updates', __name__)  # Blueprint for updates
windows_bp = Blueprint('windows', __name__)  # Blueprint for Windows updates

# Import all route handlers
from .updates import get_updates, trigger_fetch_updates
from .windows_updates import get_windows_updates, trigger_fetch_windows_updates

# Routes are registered in their respective modules
