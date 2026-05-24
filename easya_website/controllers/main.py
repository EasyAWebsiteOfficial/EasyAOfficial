# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import logging

_logger = logging.getLogger(__name__)

class EasyAWebsiteController(http.Controller):

    @http.route('/easya/website/calc_submit', type='json', auth='public', methods=['POST'], csrf=False)
    def submit_academic_calculator(self, **kwargs):
        """
        Receives AJAX pricing estimation requests from the front-end,
        validates the fields, and creates a CRM Lead for sales follow-up.
        """
        try:
            name = kwargs.get('name')
            phone = kwargs.get('phone')
            university = kwargs.get('university')
            service = kwargs.get('service')
            level = kwargs.get('level')
            qty = kwargs.get('qty')
            deadline = kwargs.get('deadline')
            price_estimate = kwargs.get('price_estimate')

            if not name or not phone:
                return {'success': False, 'error': 'Missing contact name or phone.'}

            # Build detailed description notes
            description = (
                "Yêu cầu tư vấn dịch vụ học tập Easy A:\n"
                "===========================================\n"
                f"- Tên học viên: {name}\n"
                f"- Điện thoại / Zalo: {phone}\n"
                f"- Trường Đại học: {university}\n"
                f"- Dịch vụ đăng ký: {service}\n"
                f"- Hệ đào tạo: {level}\n"
                f"- Khối lượng thực hiện: {qty}\n"
                f"- Hạn hoàn thành: {deadline}\n"
                f"- Giá ước tính trên web: {price_estimate}\n"
                "===========================================\n"
                "Hệ thống tự động ghi nhận từ bộ tính phí Easy A Calculator."
            )

            # Create Lead in CRM using superuser privileges (sudo) since website visitor is public
            lead_vals = {
                'name': f"Easy A - Tư vấn {service} ({name})",
                'contact_name': name,
                'phone': phone,
                'description': description,
                'type': 'lead',
            }
            
            # Check if custom university field exists in crm.lead model to avoid crashes
            crm_lead_model = request.env['crm.lead']
            if 'x_university' in crm_lead_model._fields:
                lead_vals['x_university'] = university

            lead_id = crm_lead_model.sudo().create(lead_vals)

            _logger.info(f"Successfully created Easy A CRM Lead ID {lead_id.id} for student {name}")
            return {'success': True, 'lead_id': lead_id.id}

        except Exception as e:
            _logger.error(f"Error submitting Easy A calculator form: {str(e)}")
            return {'success': False, 'error': str(e)}
