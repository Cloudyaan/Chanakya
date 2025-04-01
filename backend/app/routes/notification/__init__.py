
from flask import Blueprint

notification_bp = Blueprint('notification', __name__, url_prefix='/api')

# Import all route handlers
from .routes import get_notification_settings, add_notification_setting, update_notification_setting, delete_notification_setting
from .processor import send_notification, process_and_send_notification

# Register the send notification endpoint
@notification_bp.route('/send-notification', methods=['POST'])
def send_notification_route():
    """Route to send a notification immediately"""
    return send_notification()
