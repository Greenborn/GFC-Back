<?php

$params = require __DIR__ . '/params.php';
$db     = require __DIR__ . '/db.php';
$email  = require __DIR__ . '/email.php';

$config = [
    'id' => 'basic',
    'basePath' => dirname(__DIR__),
    'bootstrap' => ['log'],
    'aliases' => [
        '@bower' => '@vendor/bower-asset',
        '@npm'   => '@vendor/npm-asset',
    ],
    'components' => [
        'request' => [
            // !!! insert a secret key in the following (if it is empty) - this is required by cookie validation
            'cookieValidationKey' => '7hSF802zvlVYMSbq6E6hQlhCvJ-dQw0C',
            'parsers' => [
               'application/json' => 'yii\web\JsonParser',
               'multipart/form-data' => 'yii\web\MultipartFormDataParser'
            ],
        ],
        'cache' => [
            'class' => 'yii\caching\FileCache',
        ],
        'user' => [
            'identityClass' => 'app\models\User',
            'enableAutoLogin' => false,
            'loginUrl' => null,
        ],
        'errorHandler' => [
            'errorAction' => 'site/error',
        ],
        'mailer' => $email,
        'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error', 'warning'],
                ],
            ],
        ],
        'db' => $db,
        'response' => [
            'class' => 'yii\web\Response',
            'on beforeSend' => function ($event) {
                $response = $event->sender;
                $response->headers->set('Access-Control-Allow-Origin', '*');
                $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
                $response->headers->set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
                $response->headers->set('Access-Control-Allow-Credentials', 'true');
                $response->headers->set('Access-Control-Max-Age', '86400');
                
                if ($response->statusCode == 204) {
                    $response->content = '';
                }
            },
        ],
        'urlManager' => [
            'enablePrettyUrl' => true,
            'enableStrictParsing' => true,
            'showScriptName' => false,
            'rules' => [
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'login',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'category',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'change-password',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'change-password-token',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'contest-category',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'contest',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'contest-result',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'contest-section',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'fotoclub',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'image',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'metric',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'metric-abm',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'password-reset',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'profile-contest',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'profile',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'profile-registrable',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'role',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'section',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'user',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'info-centro',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'footer',
                    'pluralize' => false,
                ],
                [ 'class' => 'yii\rest\UrlRule',
                    'controller' => 'stadistics',
                    'pluralize' => false,
                ],[
                'class' => 'yii\rest\UrlRule',
                        'controller' => 'sign-up',
                        'pluralize' => false,
                ],

                'ranking' =>  'ranking/getranks',
                ['class' => 'yii\rest\UrlRule', 'controller' => 'public-info-centro', 'pluralize' => false ],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'public-contest', 'pluralize' => false ],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'contest-record', 'pluralize' => false ],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'compressed-photos', 'pluralize' => false ],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'results-upload', 'pluralize' => false ],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'public-profile', 'pluralize' => false ],
            ],
        ],
    ],
    'params' => $params,
];

if (YII_ENV_DEV) {
    // configuration adjustments for 'dev' environment
    $config['bootstrap'][] = 'debug';
    $config['modules']['debug'] = [
        'class' => 'yii\debug\Module',
        // uncomment the following to add your IP if you are not connecting from localhost.
        //'allowedIPs' => ['127.0.0.1', '::1'],
    ];

    $config['bootstrap'][] = 'gii';
    $config['modules']['gii'] = [
        'class' => 'yii\gii\Module',
        // uncomment the following to add your IP if you are not connecting from localhost.
        //'allowedIPs' => ['127.0.0.1', '::1'],
    ];
}


return $config;
