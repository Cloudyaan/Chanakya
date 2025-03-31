
from flask import Flask
from flask_cors import CORS

def create_app():
    """Factory function to create and configure the Flask application."""
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes
    
    # Register blueprints
    from app.routes.tenant_routes import tenant_bp
    from app.routes.azure_routes import azure_bp
    from app.routes.update_routes import update_bp
    from app.routes.license_routes import license_bp
    from app.routes.windows_routes import windows_bp
    from app.routes.news_routes import news_bp
    from app.routes.notification_routes import notification_bp
    
    app.register_blueprint(tenant_bp)
    app.register_blueprint(azure_bp)
    app.register_blueprint(update_bp)
    app.register_blueprint(license_bp)
    app.register_blueprint(windows_bp)
    app.register_blueprint(news_bp)
    app.register_blueprint(notification_bp)
    
    return app
