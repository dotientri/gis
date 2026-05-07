import json


class UTF8ResponseMiddleware:
    """
    Middleware để đảm bảo tất cả responses có charset=utf-8
    Xử lý lỗi double encoding của Tiếng Việt
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Chỉ xử lý JSON responses
        if 'application/json' in response.get('Content-Type', ''):
            # Đảm bảo charset là utf-8
            response['Content-Type'] = 'application/json; charset=utf-8'
        
        return response
