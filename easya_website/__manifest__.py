# -*- coding: utf-8 -*-
{
    'name': 'Easy A Website & Theme',
    'version': '17.0.1.0.0',
    'category': 'Theme/Creative',
    'summary': 'Website thiết kế riêng cho dịch vụ học tập sinh viên Easy A',
    'description': """
Easy A Website & Custom Theme
==================================================
Module thiết kế lại toàn bộ giao diện website tương thích với nhận diện thương hiệu Easy A:
- Màu sắc chủ đạo: Xanh dương đậm (#0a365e), vàng (#ffc331), xanh nước biển (#1a4da3)
- Giao diện trang chủ chuyên nghiệp cho 9 dịch vụ lớn và danh mục hơn 70 ngành học
- Tích hợp bộ tính giá học thuật ước tính (Academic Calculator)
- Tích hợp gửi dữ liệu tự động về Odoo CRM
    """,
    'author': 'Antigravity AI for Easy A',
    'website': 'https://www.easya.vn',
    'depends': [
        'website',
        'crm',
    ],
    'data': [
        'views/theme_easya_templates.xml',
        'views/homepage_templates.xml',
        'views/calculator_templates.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'easya_website/static/src/scss/primary_variables.scss',
            'easya_website/static/src/scss/theme.scss',
            'easya_website/static/src/js/calculator.js',
        ],
    },
    'images': [
        'static/description/icon.png',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
