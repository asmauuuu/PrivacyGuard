from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..models import db, AppPermission

permissions_bp = Blueprint('permissions', __name__)

@permissions_bp.route('/', methods=['GET'])
@jwt_required()
def get_permissions():
    # Get user ID from JWT token and convert to integer
    current_user_id = get_jwt_identity()
    user_id = int(current_user_id) if current_user_id else None
    
    # Debug print
    print(f"DEBUG - GET permissions for user_id: {user_id}")
    
    permissions = AppPermission.query.filter_by(user_id=user_id).all()
    return jsonify([perm.to_dict() for perm in permissions])

@permissions_bp.route('/<int:permission_id>', methods=['GET'])
@jwt_required()
def get_permission(permission_id):
    # Get user ID from JWT token and convert to integer
    current_user_id = get_jwt_identity()
    user_id = int(current_user_id) if current_user_id else None
    
    permission = AppPermission.query.filter_by(id=permission_id, user_id=user_id).first()
    if not permission:
        return jsonify({'error': 'Permission not found'}), 404
    return jsonify(permission.to_dict())

@permissions_bp.route('/', methods=['POST'])
@jwt_required()
def create_permission():
    # Debug logging
    print("DEBUG - Request received at /api/permissions POST endpoint")
    
    # Get user ID from JWT token and convert to integer
    current_user_id = get_jwt_identity()
    print(f"DEBUG - JWT identity: {current_user_id}, type: {type(current_user_id)}")
    
    user_id = int(current_user_id) if current_user_id else None
    print(f"DEBUG - Converted user_id: {user_id}")
    
    data = request.get_json()
    print(f"DEBUG - Request data: {data}")
    
    # Check if data is None
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
        
    # Check required fields - make is_enabled and risk_level optional
    if not all(field in data for field in ['app_name', 'permission_type']):
        return jsonify({'error': 'Missing required fields (app_name, permission_type)'}), 400

    # Create new permission with defaults for optional fields
    new_perm = AppPermission(
        user_id=user_id,  # Use the converted integer user_id
        app_name=data['app_name'],
        permission_type=data['permission_type'],
        is_enabled=data.get('is_enabled', True),
        risk_level=data.get('risk_level', 'medium'),
        last_accessed=datetime.utcnow() if data.get('is_enabled', True) else None
    )
    
    try:
        db.session.add(new_perm)
        db.session.commit()
        print(f"DEBUG - Permission created successfully: {new_perm.to_dict()}")
        return jsonify(new_perm.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print(f"DEBUG - Error creating permission: {str(e)}")
        return jsonify({'error': f'Failed to create permission: {str(e)}'}), 500

@permissions_bp.route('/<int:permission_id>', methods=['PUT'])
@jwt_required()
def update_permission(permission_id):
    # Get user ID from JWT token and convert to integer
    current_user_id = get_jwt_identity()
    user_id = int(current_user_id) if current_user_id else None
    
    permission = AppPermission.query.filter_by(id=permission_id, user_id=user_id).first()
    if not permission:
        return jsonify({'error': 'Permission not found'}), 404

    data = request.get_json()
    for field in ['app_name', 'permission_type', 'is_enabled', 'risk_level']:
        if field in data:
            setattr(permission, field, data[field])
    
    # Update last_accessed if enabling the permission
    if 'is_enabled' in data and data['is_enabled'] and not permission.is_enabled:
        permission.last_accessed = datetime.utcnow()

    try:
        db.session.commit()
        return jsonify(permission.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update permission: {str(e)}'}), 500

@permissions_bp.route('/<int:permission_id>', methods=['DELETE'])
@jwt_required()
def delete_permission(permission_id):
    # Get user ID from JWT token and convert to integer
    current_user_id = get_jwt_identity()
    user_id = int(current_user_id) if current_user_id else None
    
    permission = AppPermission.query.filter_by(id=permission_id, user_id=user_id).first()
    if not permission:
        return jsonify({'error': 'Permission not found'}), 404

    try:
        db.session.delete(permission)
        db.session.commit()
        return jsonify({'message': 'Permission deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete permission: {str(e)}'}), 500