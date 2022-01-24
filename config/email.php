<?php

return [
    'class' => 'yii\swiftmailer\Mailer',
    'transport' => [
        'class' => 'Swift_SmtpTransport',
        'host' => '',  // ej. smtp.mandrillapp.com o smtp.gmail.com
        'username' => '',
        'password' => '',
        'port' => '587', // El puerto 25 es un puerto común también
        'encryption' => 'tls', // Es usado también a menudo, revise la configuración del servidor
      ],
    ];