<?php
namespace app\controllers;

use yii\rest\ActiveController;
// use yii\web\UploadedFile;
use Yii;


class ImageController extends BaseController {

    public $modelClass = 'app\models\Image';

     
    public function checkAccess($action, $model = null, $params = [])
    {
      $paramsGet = Yii::$app->getRequest()->getBodyParams();
      // throw ForbiddenHttpException if access should be denied
      if ($action === 'create' ) {
        if ($model == null) {
          $prf_id = $paramsGet["profile_id"];
          // $prf_id = $params["profile_id"];
        } 
          if (($prf_id !==  Yii::$app->user->identity->profile_id)
          && Yii::$app->user->identity->role_id == 3)
              throw new \yii\web\ForbiddenHttpException(sprintf('No puede inscribir porque no es su usuario. Usuario que quiere inscribir: %d, su usuario: %d',  $prf_id, Yii::$app->user->identity->profile_id));
              if (($prf_id ==  Yii::$app->user->identity->profile_id)
              && Yii::$app->user->identity->role_id == 1)
              throw new \yii\web\ForbiddenHttpException(sprintf('No puede inscribirse un usuario administrador'));


       }
    }

    // public function actionUpload()
    // {
    //     $model = new $this->modelClass;

    //     if (Yii::$app->request->isPost) {
    //         $model->image_file = UploadedFile::getInstance($model, 'image_file');
    //         if ($model->upload()) {
    //             // el archivo se subió exitosamente
    //             return;
    //         }
    //     }

    //     // return $this->render('upload', ['model' => $model]);
    // }
}