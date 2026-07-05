import React from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const AccountHolderForm = ({ formData, errors, updateFormData }) => {
  const accessPermissionOptions = [
    { value: 'family', label: 'Solo Familia', description: 'Acceso restringido a familiares' },
    { value: 'friends', label: 'Familia y Amigos', description: 'Acceso ampliado' },
    { value: 'public', label: 'Público', description: 'Cualquiera puede ver' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Titular de Cuenta</h3>
        <p className="text-sm text-muted-foreground">Información del contacto familiar responsable del tributo</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Nombre del Contacto Familiar"
            placeholder="Ej: Juan Rodríguez"
            value={formData?.familyContactName}
            onChange={(e) => updateFormData('familyContactName', e?.target?.value)}
            error={errors?.familyContactName}
            required
          />
        </div>

        <Input
          label="Documento de Identidad del Titular"
          placeholder="Ej: C.C. 12345678"
          value={formData?.familyContactDocumentId}
          onChange={(e) => updateFormData('familyContactDocumentId', e?.target?.value)}
          error={errors?.familyContactDocumentId}
          description="Documento del titular de la cuenta, útil para trámites y cruces con CRM."
        />

        <Input
          type="tel"
          label="Teléfono de Contacto"
          placeholder="Ej: +57 300 123 4567"
          value={formData?.familyContactPhone}
          onChange={(e) => updateFormData('familyContactPhone', e?.target?.value)}
          error={errors?.familyContactPhone}
          description="Incluya código de país"
        />

        <Input
          type="email"
          label="Correo Electrónico"
          placeholder="Ej: contacto@ejemplo.com"
          value={formData?.familyContactEmail}
          onChange={(e) => updateFormData('familyContactEmail', e?.target?.value)}
          error={errors?.familyContactEmail}
          required
        />

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-foreground block mb-2">
            Dirección de Facturación
          </label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Calle, número, ciudad, código postal..."
            value={formData?.billingAddress}
            onChange={(e) => updateFormData('billingAddress', e?.target?.value)}
            rows={3}
          />
        </div>

        <div className="md:col-span-2">
          <Select
            label="Permisos de Acceso"
            placeholder="Seleccione nivel de acceso"
            options={accessPermissionOptions}
            value={formData?.accessPermissions}
            onChange={(value) => updateFormData('accessPermissions', value)}
            required
          />
        </div>
      </div>
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 rounded-full p-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-foreground mb-1">Privacidad y Seguridad</h4>
            <p className="text-xs text-muted-foreground">
              La información del titular de cuenta se mantiene privada y solo se utiliza para gestión administrativa. 
              Los visitantes del tributo no tendrán acceso a estos datos.
            </p>
          </div>
        </div>
      </div>
      <div className="bg-success/5 border border-success/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-success/10 rounded-full p-2">
            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-foreground mb-1">Listo para Crear</h4>
            <p className="text-xs text-muted-foreground">
              Una vez complete todos los campos requeridos, podrá crear el tributo y generar la URL única para las pantallas digitales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountHolderForm;