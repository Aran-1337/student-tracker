import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Student, Group, Grade } from '@/lib/types';
import { User, Phone, Wallet, Save } from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  groups: Group[];
  grades: Grade[];
  onSave: (studentId: string, updates: Partial<Student>) => Promise<void>;
}

export function StudentProfileModal({
  isOpen,
  onClose,
  student,
  groups,
  grades,
  onSave
}: StudentProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'financial'>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({});

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        grade_id: student.grade_id,
        group_id: student.group_id,
        parent_phone: student.parent_phone || "",
        parent_job: student.parent_job || "",
        student_email: student.student_email || "",
        discount_value: student.discount_value || 0,
        discount_reason: student.discount_reason || "",
        apply_discount_to_books: student.apply_discount_to_books || false,
      });
      setActiveTab('basic');
    }
  }, [student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!student) return;
    setIsLoading(true);
    try {
      // Clean up empty strings for numbers
      const sanitizedData = { ...formData };
      if ((sanitizedData.discount_value as unknown as string) === '') {
        sanitizedData.discount_value = 0;
      }
      
      await onSave(student.id, sanitizedData);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`تعديل بيانات الطالب: ${student.name}`}
      maxWidth="600px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isLoading} leftIcon={<Save size={18} />}>حفظ التغييرات</Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('basic')}
          style={{ 
            background: activeTab === 'basic' ? 'var(--color-teal)' : 'transparent',
            color: activeTab === 'basic' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <User size={16} /> أساسية
        </button>
        <button 
          onClick={() => setActiveTab('contact')}
          style={{ 
            background: activeTab === 'contact' ? 'var(--color-teal)' : 'transparent',
            color: activeTab === 'contact' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <Phone size={16} /> تواصل
        </button>
        <button 
          onClick={() => setActiveTab('financial')}
          style={{ 
            background: activeTab === 'financial' ? 'var(--color-teal)' : 'transparent',
            color: activeTab === 'financial' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <Wallet size={16} /> مالية وخصومات
        </button>
      </div>

      <div style={{ minHeight: '250px' }}>
        {activeTab === 'basic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Input
              label="اسم الطالب"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
            />
            <div className="form-group">
              <label className="form-label">السنة الدراسية</label>
              <select
                name="grade_id"
                className="form-input"
                value={formData.grade_id || ''}
                onChange={(e) => {
                  handleChange(e);
                  setFormData(prev => ({ ...prev, group_id: '' })); // reset group
                }}
              >
                <option value="">-- اختر السنة الدراسية --</option>
                {grades.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">المجموعة</label>
              <select
                name="group_id"
                className="form-input"
                value={formData.group_id || ''}
                onChange={handleChange}
              >
                <option value="">-- بدون مجموعة --</option>
                {groups
                  .filter(g => !formData.grade_id || g.grade_id === formData.grade_id)
                  .map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))
                }
              </select>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Input
              label="رقم هاتف ولي الأمر (للواتساب)"
              name="parent_phone"
              value={formData.parent_phone || ''}
              onChange={handleChange}
              placeholder="مثال: 01000000000"
            />
            <Input
              label="وظيفة ولي الأمر"
              name="parent_job"
              value={formData.parent_job || ''}
              onChange={handleChange}
              placeholder="مثال: مهندس، دكتور..."
            />
            <Input
              label="إيميل الطالب (لربط منصات الامتحانات)"
              name="student_email"
              type="email"
              value={formData.student_email || ''}
              onChange={handleChange}
              placeholder="student@example.com"
            />
          </div>
        )}

        {activeTab === 'financial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ 
              background: 'rgba(20, 184, 166, 0.1)', 
              border: '1px solid rgba(20, 184, 166, 0.2)', 
              padding: '15px', 
              borderRadius: '8px',
              marginBottom: '10px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--color-teal)' }}>إعدادات الخصم الثابت</h4>
              <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                قيمة الخصم سيتم طرحها أوتوماتيكياً من مصاريف الطالب كل شهر وقت إصدار الفاتورة.
              </p>
              
              <Input
                label="قيمة الخصم بالجنيه"
                name="discount_value"
                type="number"
                min={0}
                value={formData.discount_value === undefined ? '' : formData.discount_value}
                onChange={handleChange}
                placeholder="مثال: 50"
              />
            </div>
            
            <Input
              label="سبب الخصم (ملاحظة للسكرتارية)"
              name="discount_reason"
              value={formData.discount_reason || ''}
              onChange={handleChange}
              placeholder="مثال: أيتام، إخوة، ظروف مادية..."
            />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <input
                type="checkbox"
                id="apply_discount_to_books"
                name="apply_discount_to_books"
                checked={formData.apply_discount_to_books || false}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="apply_discount_to_books" style={{ cursor: 'pointer' }}>
                تطبيق هذا الخصم على المذكرات والكتب أيضاً
              </label>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
