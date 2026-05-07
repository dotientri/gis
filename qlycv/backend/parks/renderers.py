from rest_framework.renderers import JSONRenderer
import json


class UTF8JSONRenderer(JSONRenderer):
    """
    Custom JSON Renderer để đảm bảo UTF-8 encoding chính xác
    Xử lý lỗi double encoding của Tiếng Việt
    """
    
    charset = 'utf-8'
    
    def render(self, data, accepted_media_type=None, renderer_context=None):
        """
        Render data thành JSON với UTF-8 encoding
        """
        if data is None:
            return b'null'
        
        # Sử dụng ensure_ascii=False để giữ ký tự Unicode
        return json.dumps(
            data,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(',', ':'),
            cls=self.encoder_class
        ).encode('utf-8')
