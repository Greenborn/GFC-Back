<?php
namespace app\actions;

use Yii;
use yii\rest\ViewAction;

class CompressedPhotosGetAction extends ViewAction {

    public function run( $id ) {
        $params = Yii::$app->getRequest()->getBodyParams();

        $response = Yii::$app->getResponse();
        $response->format = \yii\web\Response::FORMAT_JSON;

        $response->data = [
            'status' => true,
            'download_url' => 'Error no se pudo cambiar la contraseña!',
        ];                     
    }
}
