const axios = require('axios')

async function sendEmail(email_data) {
  const url = global.config.email_service_url

  const headers = {
    'Content-Type': 'application/json'
  }

  try {
    const response = await axios.post(url, email_data, { headers });
    const statusCode = response.status

    console.log(`Email enviado con código de estado ${statusCode}`)
  } catch (error) {
    console.error('Error al enviar email:', error);
  }
}

module.exports = {
  sendEmail
}