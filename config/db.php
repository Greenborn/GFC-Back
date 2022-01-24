<?php

return [
    'class' => 'yii\db\Connection',
    'dsn' => 'mysql:host=localhost;dbname=grupo_fotografico',
    //'dsn' => 'pgsql:host=ec2-54-147-76-191.compute-1.amazonaws.com;dbname=dacosg101g37gp',
    // 'dsn' => 'pgsql:host=localhost;dbname=greenborn_gfc_api',
    'username' => 'root',
    'password' => 'LuchO',
    // 'username' => 'root',
    // 'password' => 'LuchO',
    // 'username' => 'postgres',
    // 'password' => 'password',
    'charset' => 'utf8',

    // Schema cache options (for production environment)
    //'enableSchemaCache' => true,
    //'schemaCacheDuration' => 60,
    //'schemaCache' => 'cache',
];

// uri
// postgres://aaxxutmklkdlym:597ce06c95be3f6402ad5fa6108c9cd5ba033890a4f188e8c8bf9c58a8aa3bea@ec2-54-147-76-191.compute-1.amazonaws.com:5432/dacosg101g37gp