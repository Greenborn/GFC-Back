<?php
namespace app\controllers;

use yii\rest\ActiveController;
// use yii\web\UploadedFile;


class ImageController extends BaseController {

    public $modelClass = 'app\models\Image';

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