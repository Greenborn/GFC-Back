<?php
namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;
use app\models\User;


class ProfileController extends BaseController {

    public $modelClass = 'app\models\Profile';

    public function prepareDataProvider(){
        $query = $this->modelClass::find();
  
        $query = $this->addFilterConditions($query);
  
        // $user = User::findIdentityByAccessToken($this->getAccessToken());
        $user = Yii::$app->user->identity;
        if ($user->role_id == 2) { // delegado
          $query = $query->andWhere( ['fotoclub_id' => $user->profile->fotoclub_id] );
        //   $query = $query->andWhere( ['user.role_id' => 3 ] )->joinWith('user');
          $query = $query->andWhere( ['in', 'id', User::find()->select('profile_id')->where(['role_id' => 3])] );
        }
  
        return new ActiveDataProvider([
          'query' => $query->orderBy(['id' => SORT_ASC]),
        ]);
    }


}