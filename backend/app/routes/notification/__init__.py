
from flask import Blueprint

notification_bp = Blueprint('notification', __name__, url_prefix='/api')

from backend.app.routes.notification.routes import *
from backend.app.routes.notification.settings import *
from backend.app.routes.notification.email import *
from backend.app.routes.notification.scheduler import *

# Initialize the notification table
from backend.app.routes.notification.database import init_notification_table
init_notification_table()
