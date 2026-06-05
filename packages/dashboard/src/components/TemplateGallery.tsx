import React, { useState } from 'react'

export interface Template {
  id: string
  name: string
  description: string
  fieldCount: number
  category: string
}

/**
 * Gallery component displaying form templates with filtering and selection.
 */
export const TemplateGallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  // Mock template data
  const templates: Template[] = [
    {
      id: 'contact-us',
      name: 'Contact Us',
      description: 'Simple contact form with name, email, subject, and message',
      fieldCount: 4,
      category: 'communication',
    },
    {
      id: 'survey',
      name: 'Customer Survey',
      description: 'Gather customer feedback with ratings and text responses',
      fieldCount: 8,
      category: 'feedback',
    },
    {
      id: 'registration',
      name: 'User Registration',
      description: 'Multi-step registration with profile information and preferences',
      fieldCount: 12,
      category: 'user-management',
    },
    {
      id: 'job-application',
      name: 'Job Application',
      description: 'Comprehensive application form with file uploads and questions',
      fieldCount: 15,
      category: 'hr',
    },
    {
      id: 'event-signup',
      name: 'Event Signup',
      description: 'Event registration with date, time, and attendee information',
      fieldCount: 6,
      category: 'events',
    },
    {
      id: 'product-feedback',
      name: 'Product Feedback',
      description: 'Detailed product feedback form with NPS and open-ended questions',
      fieldCount: 10,
      category: 'feedback',
    },
    {
      id: 'appointment-booking',
      name: 'Appointment Booking',
      description: 'Schedule appointments with date/time selection and notes',
      fieldCount: 7,
      category: 'scheduling',
    },
    {
      id: 'bug-report',
      name: 'Bug Report',
      description: 'Technical bug report form with environment and reproduction steps',
      fieldCount: 9,
      category: 'support',
    },
  ]

  const categories = ['all', ...new Set(templates.map((t) => t.category))].map((cat) => ({
    id: cat,
    label: cat === 'all' ? 'All Templates' : cat.replace('-', ' '),
  }))

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === selectedCategory)

  const handleUseTemplate = (template: Template) => {
    console.log('Using template:', template.id)
    // This would trigger form creation with the template
  }

  return (
    <div>
      {/* Category Filter */}
      <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedCategory === cat.id ? '#0066cc' : '#fff',
              color: selectedCategory === cat.id ? '#fff' : '#333',
              border: selectedCategory === cat.id ? 'none' : '1px solid #ccc',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
      </div>

      {/* Template Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'
            }}
          >
            {/* Card Header */}
            <div
              style={{
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
                    {template.name}
                  </h3>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      backgroundColor: '#0066cc',
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}
                  >
                    {template.category.replace('-', ' ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#666', lineHeight: '1.5' }}>
                {template.description}
              </p>

              <div
                style={{
                  padding: '10px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#999',
                  marginBottom: '15px',
                }}
              >
                📋 {template.fieldCount} field{template.fieldCount !== 1 ? 's' : ''}
              </div>

              <button
                onClick={() => {
                  handleUseTemplate(template)
                  setSelectedTemplate(template)
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#0066cc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0052a3'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0066cc'
                }}
              >
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#999',
          }}
        >
          <div style={{ fontSize: '16px', marginBottom: '10px' }}>No templates found</div>
          <div style={{ fontSize: '13px' }}>Try selecting a different category</div>
        </div>
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>{selectedTemplate.name}</h2>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              {selectedTemplate.description}
            </p>

            <div
              style={{
                padding: '15px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: '14px',
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                <strong>Category:</strong> {selectedTemplate.category.replace('-', ' ')}
              </div>
              <div>
                <strong>Fields:</strong> {selectedTemplate.fieldCount}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  handleUseTemplate(selectedTemplate)
                  setSelectedTemplate(null)
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#0066cc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Use Template
              </button>
              <button
                onClick={() => setSelectedTemplate(null)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
