<?php
namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;

// use app\modules\v1\models\User;
use app\models\Profile;



class UserController extends BaseController {

    public $modelClass = 'app\models\User';

    public function actions(){
        $actions = parent::actions();
        $actions['create']['class'] = 'app\actions\UserCreateAction';
        $actions['update']['class'] = 'app\actions\UserUpdateAction';
        return $actions;
    } 

    public function prepareDataProvider(){
      $query = $this->modelClass::find();

      $query = $this->addFilterConditions($query);

      // $user = User::findIdentityByAccessToken($this->getAccessToken());
      $user = Yii::$app->user->identity;
      if ($user->role_id == 2) { // delegado
        $query = $query->andWhere( ['role_id' => 3 ] );
        $query = $query->andWhere( ['in', 'profile_id', Profile::find()->select('id')->where(['fotoclub_id' => $user->profile->fotoclub_id])] );
      }

      return new ActiveDataProvider([
        'query' => $query->orderBy(['id' => SORT_ASC]),
      ]);
  }
      
    // public function actionIndex() {
    //    return new ActiveDataProvider([
    //      'query' => User::find()->where(['role_id'=>3]),
    //    ]);
    // }

}
