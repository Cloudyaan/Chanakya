
from flask import Flask
from flask_cors import CORS
from app.database import init_db
from app.routes.tenant_routes import tenant_bp
from app.routes.azure_routes import azure_bp
from app.routes.update.updates import updates_bp
from app.routes.update.windows_updates import windows_bp
from app.routes.news_routes import news_bp
from app.routes.notification.routes import notification_bp
from app.routes.license_routes import license_bp
from app.routes.windows_routes import windows_products_bp
from app.routes.identity_routes import identity_bp  # Import the new blueprint

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Initialize database
    init_db()
    
    # Register blueprints
    app.register_blueprint(tenant_bp, url_prefix='/api')
    app.register_blueprint(azure_bp, url_prefix='/api')
    app.register_blueprint(updates_bp, url_prefix='/api')
    app.register_blueprint(windows_bp, url_prefix='/api')
    app.register_blueprint(news_bp, url_prefix='/api')
    app.register_blueprint(notification_bp, url_prefix='/api')
    app.register_blueprint(license_bp, url_prefix='/api')
    app.register_blueprint(windows_products_bp, url_prefix='/api')
    app.register_blueprint(identity_bp, url_prefix='/api')  # Register the new blueprint
    
    return app
