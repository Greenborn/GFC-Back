<?php
namespace app\controllers;

use yii\rest\ActiveController;


class FotoclubController extends BaseController {

    protected bool $autenticator = false;
    //TODO: solo no necesita autentificacion para get, para lo demas si, modificar¿? en footer tambien
    public $modelClass = 'app\models\Fotoclub';

}