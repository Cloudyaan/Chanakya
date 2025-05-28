
from flask import Blueprint

notification_bp = Blueprint('notification', __name__, url_prefix='/api')

# Import only the route handlers we need to register them
from .routes import (
    get_notification_settings,
    add_notification_setting, 
    update_notification_setting,
    delete_notification_setting,
    send_notification
)

# Import the processor function with a different name to avoid conflicts
from .processor import process_and_send_notification as process_notification
