
from flask import Blueprint

notification_bp = Blueprint('notification', __name__, url_prefix='/api')

# Import all route handlers to register them
from .routes import *
from .processor import process_and_send_notification
