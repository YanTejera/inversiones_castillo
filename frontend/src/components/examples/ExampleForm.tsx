import React from 'react';
import { User, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import { useForm } from '../../hooks/useForm';
import { Form, FormField } from '../form';
import { VALIDATION_SCHEMAS } from '../../utils/validations';

// Example of how to use the form system
interface ClienteFormData {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  fecha_nacimiento: string;
}

interface ExampleFormProps {
  onClose: () => void;
  onSave: (data: ClienteFormData) => Promise<void>;
  initialData?: Partial<ClienteFormData>;
}

const ExampleForm: React.FC<ExampleFormProps> = ({ onClose, onSave, initialData = {} }) => {
  const form = useForm<ClienteFormData>({
    initialValues: {
      nombre: '',
      apellido: '',
      cedula: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: '',
      fecha_nacimiento: '',
      ...initialData
    },
    validationSchema: VALIDATION_SCHEMAS.cliente,
    onSubmit: async (values) => {
      await onSave(values);
      onClose();
    },
    enableRealTimeValidation: true,
    autoFocus: true,
    resetOnSuccess: false
  });

  const cityOptions = [
    { value: 'bogota', label: 'Bogotá' },
    { value: 'medellin', label: 'Medellín' },
    { value: 'cali', label: 'Cali' },
    { value: 'barranquilla', label: 'Barranquilla' },
    { value: 'cartagena', label: 'Cartagena' }
  ];

  return (
    <Form
      onSubmit={form.handleSubmit}
      title="Formulario de Cliente"
      description="Ingresa los datos del cliente"
      isSubmitting={form.isSubmitting}
      onCancel={onClose}
      submitLabel="Guardar Cliente"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Nombre"
          name="nombre"
          type="text"
          icon={<User className="h-4 w-4" />}
          value={form.values.nombre}
          onChange={form.handleChange('nombre')}
          onBlur={form.handleBlur('nombre')}
          error={form.errors.nombre}
          touched={form.touched.nombre}
          fieldRef={form.getFieldRef('nombre')}
          required
          placeholder="Ingresa el nombre"
          helpText="Solo letras y espacios"
        />

        <FormField
          label="Apellido"
          name="apellido"
          type="text"
          icon={<User className="h-4 w-4" />}
          value={form.values.apellido}
          onChange={form.handleChange('apellido')}
          onBlur={form.handleBlur('apellido')}
          error={form.errors.apellido}
          touched={form.touched.apellido}
          fieldRef={form.getFieldRef('apellido')}
          required
          placeholder="Ingresa el apellido"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Cédula"
          name="cedula"
          type="text"
          icon={<CreditCard className="h-4 w-4" />}
          value={form.values.cedula}
          onChange={form.handleChange('cedula')}
          onBlur={form.handleBlur('cedula')}
          error={form.errors.cedula}
          touched={form.touched.cedula}
          fieldRef={form.getFieldRef('cedula')}
          required
          placeholder="12345678"
          helpText="Sin puntos ni espacios"
        />

        <FormField
          label="Teléfono"
          name="telefono"
          type="tel"
          icon={<Phone className="h-4 w-4" />}
          value={form.values.telefono}
          onChange={form.handleChange('telefono')}
          onBlur={form.handleBlur('telefono')}
          error={form.errors.telefono}
          touched={form.touched.telefono}
          fieldRef={form.getFieldRef('telefono')}
          required
          placeholder="300 123 4567"
        />
      </div>

      <FormField
        label="Email"
        name="email"
        type="email"
        icon={<Mail className="h-4 w-4" />}
        value={form.values.email}
        onChange={form.handleChange('email')}
        onBlur={form.handleBlur('email')}
        error={form.errors.email}
        touched={form.touched.email}
        fieldRef={form.getFieldRef('email')}
        placeholder="ejemplo@correo.com"
        helpText="Opcional"
      />

      <FormField
        label="Dirección"
        name="direccion"
        type="textarea"
        icon={<MapPin className="h-4 w-4" />}
        value={form.values.direccion}
        onChange={form.handleChange('direccion')}
        onBlur={form.handleBlur('direccion')}
        error={form.errors.direccion}
        touched={form.touched.direccion}
        fieldRef={form.getFieldRef('direccion')}
        required
        rows={2}
        placeholder="Dirección completa"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Ciudad"
          name="ciudad"
          type="select"
          icon={<MapPin className="h-4 w-4" />}
          value={form.values.ciudad}
          onChange={form.handleChange('ciudad')}
          onBlur={form.handleBlur('ciudad')}
          error={form.errors.ciudad}
          touched={form.touched.ciudad}
          fieldRef={form.getFieldRef('ciudad')}
          options={cityOptions}
          required
        />

        <FormField
          label="Fecha de Nacimiento"
          name="fecha_nacimiento"
          type="date"
          value={form.values.fecha_nacimiento}
          onChange={form.handleChange('fecha_nacimiento')}
          onBlur={form.handleBlur('fecha_nacimiento')}
          error={form.errors.fecha_nacimiento}
          touched={form.touched.fecha_nacimiento}
          fieldRef={form.getFieldRef('fecha_nacimiento')}
          helpText="Opcional - debe ser mayor de 18 años"
        />
      </div>

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 p-4 bg-gray-100 rounded">
          <summary className="cursor-pointer font-medium">Debug Info</summary>
          <div className="mt-2 space-y-2 text-sm">
            <div><strong>Valid:</strong> {form.isValid ? 'Yes' : 'No'}</div>
            <div><strong>Dirty:</strong> {form.isDirty ? 'Yes' : 'No'}</div>
            <div><strong>Submitting:</strong> {form.isSubmitting ? 'Yes' : 'No'}</div>
            <div><strong>Errors:</strong> <pre>{JSON.stringify(form.errors, null, 2)}</pre></div>
            <div><strong>Touched:</strong> <pre>{JSON.stringify(form.touched, null, 2)}</pre></div>
          </div>
        </details>
      )}
    </Form>
  );
};

export default ExampleForm;