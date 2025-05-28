
from flask import Blueprint

notification_bp = Blueprint('notification', __name__, url_prefix='/api')

# Import all route handlers
from .routes import get_notification_settings, add_notification_setting, update_notification_setting, delete_notification_setting, send_notification
from .processor import process_and_send_notification

# Note: send_notification route is already registered in routes.py, so we don't need to register it again here
