
from flask import Flask
from flask_cors import CORS
from app.database import init_db
from app.routes.tenant_routes import tenant_bp
from app.routes.azure_routes import azure_bp
from app.routes.license_routes import license_bp
from app.routes.news_routes import news_bp
from app.routes.update.updates import updates_bp
from app.routes.windows_routes import windows_bp
from app.routes.notification.routes import notification_bp
from app.routes.identity_routes import identity_bp

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize the database
init_db()

# Register blueprints
app.register_blueprint(tenant_bp)
app.register_blueprint(azure_bp)
app.register_blueprint(license_bp)
app.register_blueprint(news_bp)
app.register_blueprint(updates_bp)
app.register_blueprint(windows_bp)
app.register_blueprint(notification_bp)
app.register_blueprint(identity_bp)  # Add the identity routes

# Default route
@app.route('/')
def hello():
    return "Chanakya Backend API"
