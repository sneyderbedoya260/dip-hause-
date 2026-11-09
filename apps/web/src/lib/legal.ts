export const legal = {
  name: process.env.BUSINESS_LEGAL_NAME ?? '[Nombre o razón social]',
  nit: process.env.BUSINESS_NIT ?? '[NIT]',
  email: process.env.BUSINESS_EMAIL ?? '[correo de contacto]',
  phone: process.env.BUSINESS_PHONE ?? '[teléfono]',
  address: process.env.BUSINESS_ADDRESS ?? '[dirección]',
};
