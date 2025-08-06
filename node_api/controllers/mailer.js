const axios = require('axios')

async function sendEmail(email_data) {
  const url = global.config.email_service_url + '/email';

  const headers = {
    'Content-Type': 'application/json'
  };

  // Agregar el token al objeto email_data
  email_data.token = global.config.TOKEN_NOTIFICADOR;

  try {
    const response = await axios.post(url, email_data, { headers });
    const statusCode = response.status;

    console.log(`Email enviado con código de estado ${statusCode}`);
    return { status: statusCode };
  } catch (error) {
    console.error('Error al enviar email:', error);
    return { error: error };
  }
}

module.exports = {
  sendEmail
}