<?php
namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;

use app\models\Profile;

class ContestResultController extends BaseController {

    public $modelClass = 'app\models\ContestResult';

    public function prepareDataProvider(){
        $user = Yii::$app->user->identity;
        $esDelegado = $user->role_id == 2;

        $query = $this->modelClass::find();

        if ($esDelegado) {
            $query = $query->joinWith('image');
        }

        $query = $this->addFilterConditions($query);
  
        // $user = User::findIdentityByAccessToken($this->getAccessToken());
        if ($esDelegado) { // delegado
          $query = $query->andWhere( ['in', 'image.profile_id', Profile::find()->select('id')->where(['fotoclub_id' => $user->profile->fotoclub_id])] );
        }
  
        return new ActiveDataProvider([
          'query' => $query->orderBy(['id' => SORT_ASC]),
        ]);
    }
}