
from flask import Blueprint

notification_bp = Blueprint('notification', __name__, url_prefix='/api')

# Import routes using relative imports instead of absolute imports with 'backend'
from app.routes.notification.routes import *
from app.routes.notification.settings import *
from app.routes.notification.email import *
from app.routes.notification.scheduler import *

# Initialize the notification table
from app.routes.notification.database import init_notification_table
init_notification_table()
