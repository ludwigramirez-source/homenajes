import React, { useRef } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';

const DeceasedInfoForm = ({ formData, errors, updateFormData }) => {
  const fileInputRef = useRef(null);

  const handlePhotoUpload = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file?.type?.startsWith('image/')) {
        alert('Por favor seleccione un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (máx 5MB)
      if (file?.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar 5MB');
        return;
      }
      
      updateFormData('photo', file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData('photoPreview', reader?.result);
      };
      reader?.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    updateFormData('photo', null);
    updateFormData('photoPreview', null);
    if (fileInputRef?.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Información del Difunto</h3>
        <p className="text-sm text-muted-foreground">Ingrese los datos personales y biografía del ser querido</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Nombre Completo"
            placeholder="Ej: María Elena Rodríguez García"
            value={formData?.fullName}
            onChange={(e) => updateFormData('fullName', e?.target?.value)}
            error={errors?.fullName}
            required
          />
        </div>

        <Input
          type="date"
          label="Fecha de Nacimiento"
          value={formData?.birthDate}
          onChange={(e) => updateFormData('birthDate', e?.target?.value)}
          error={errors?.birthDate}
          required
        />

        <Input
          type="date"
          label="Fecha de Fallecimiento"
          value={formData?.deathDate}
          onChange={(e) => updateFormData('deathDate', e?.target?.value)}
          error={errors?.deathDate}
          required
        />

        <Input
          label="Documento de Identidad"
          placeholder="Ej: C.C. 12345678"
          value={formData?.deceasedDocumentId}
          onChange={(e) => updateFormData('deceasedDocumentId', e?.target?.value)}
          error={errors?.deceasedDocumentId}
          description="Cédula u otro documento del difunto. Ayuda a diferenciar homónimos y a cruzar información con sistemas externos (CRM)."
        />

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-foreground block mb-2">
            Biografía / Mensaje Conmemorativo
          </label>
          <textarea
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Escriba una biografía breve o mensaje conmemorativo que describa la vida y legado del difunto..."
            value={formData?.biography}
            onChange={(e) => updateFormData('biography', e?.target?.value)}
            rows={5}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData?.biography?.length || 0} / 500 caracteres
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-foreground block mb-2">
            Fotografía del Difunto <span className="text-destructive">*</span>
          </label>
          
          {!formData?.photoPreview ? (
            <div
              onClick={() => fileInputRef?.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                errors?.photo
                  ? "border-destructive bg-destructive/5" :"border-border hover:border-accent hover:bg-accent/5"
              )}
            >
              <Icon name="Upload" size={32} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1">
                Haga clic para cargar una fotografía
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG o WEBP (máx. 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <div className="border border-border rounded-lg p-4 bg-muted/20">
                <img
                  src={formData?.photoPreview}
                  alt="Vista previa de fotografía del difunto"
                  className="w-full h-64 object-cover rounded-md"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Upload"
                  onClick={() => fileInputRef?.current?.click()}
                >
                  Cambiar Foto
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  iconName="Trash2"
                  onClick={removePhoto}
                >
                  Eliminar
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          )}
          
          {errors?.photo && (
            <p className="text-sm text-destructive mt-2">{errors?.photo}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeceasedInfoForm;