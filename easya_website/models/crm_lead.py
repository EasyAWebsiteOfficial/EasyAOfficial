# -*- coding: utf-8 -*-
from odoo import models, fields

class CrmLead(models.Model):
    """
    Extends CRM Lead model to add specific custom fields
    required for student profiles registering at Easy A.
    """
    _inherit = 'crm.lead'

    x_university = fields.Char(
        string='Trường Đại học', 
        help='Tên trường đại học của sinh viên đăng ký dịch vụ Easy A'
    )
