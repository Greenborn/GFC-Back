<?php
namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;
use app\models\User;


class PublicProfileController extends BaseController {

    public $modelClass = 'app\models\Profile';
    protected bool $autenticator = false;

    public function actions(){
        $actions = parent::actions();
        unset( $actions['delete'],
               $actions['update'],
               $actions['create'],
             );
        return $actions;
  
      }

    public function prepareDataProvider(){
        $query = $this->modelClass::find();
  
        $query = $this->addFilterConditions($query);
  
        $user = Yii::$app->user->identity;
        if ($user !== null && $user->role_id == 2) { // delegado
          $query = $query->andWhere( ['fotoclub_id' => $user->profile->fotoclub_id] );
        //   $query = $query->andWhere( ['user.role_id' => 3 ] )->joinWith('user');
          $query = $query->andWhere( ['in', 'id', User::find()->select('profile_id')->where(['role_id' => 3])] );
        }
  
        return new ActiveDataProvider([
          'query' => $query->orderBy(['id' => SORT_ASC]),
          'pagination' => [
                'pageSize' => 500
          ]
        ]);
    }


}