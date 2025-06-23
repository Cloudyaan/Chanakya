
from flask import Flask
from flask_cors import CORS
from .routes.tenant_routes import tenant_bp
from .routes.azure_routes import azure_bp
from .routes.update.updates import updates_bp
from .routes.update.windows_updates import windows_updates_bp
from .routes.news_routes import news_bp
from .routes.notification.routes import notification_bp
from .routes.refresh_times_routes import refresh_times_bp

def create_app():
    app = Flask(__name__)
    
    # Enable CORS for all routes
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints with API prefix
    app.register_blueprint(tenant_bp, url_prefix='/api')
    app.register_blueprint(azure_bp, url_prefix='/api')
    app.register_blueprint(updates_bp, url_prefix='/api')
    app.register_blueprint(windows_updates_bp, url_prefix='/api')
    app.register_blueprint(news_bp, url_prefix='/api')
    app.register_blueprint(notification_bp, url_prefix='/api')
    app.register_blueprint(refresh_times_bp, url_prefix='/api')
    
    return app
