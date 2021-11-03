<?php
namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;
use yii\web\BadRequestHttpException;
use app\models\User;
use app\models\ProfileContest;


class ProfileRegistrableController extends BaseController {

    public $modelClass = 'app\models\Profile';

    public function actions(){
      $actions = parent::actions();
      unset( $actions['delete'],
             $actions['create'],
            //  $actions['index'],
             $actions['update'],
             $actions['view'],
           );

      return $actions;
    }

    public function prepareDataProvider(){
        $query = $this->modelClass::find();
  
        // $query = $this->addFilterConditions($query);

        $contest_id = Yii::$app->request->get('contest_id');

      if (!empty($contest_id) && is_numeric($contest_id)) {
        $user = Yii::$app->user->identity;
        $query = $query->where(['in', 'id', User::find()->select('profile_id')->where(['role_id' => 3])]);
        $query = $query->andWhere(['not in', 'id', ProfileContest::find()->select('profile_id')->where(['contest_id' => $contest_id])]);
        if ($user->role_id == 2) { // delegado
          $query = $query->andWhere( ['fotoclub_id' => $user->profile->fotoclub_id] );
          // $query = $query->andWhere( ['in', 'id', User::find()->select('profile_id')->where(['role_id' => 3])] );
        }
  
        return new ActiveDataProvider([
          'query' => $query->orderBy(['id' => SORT_ASC]),
        ]);
      } else {
        throw new BadRequestHttpException('Especificar el id concurso del que se quiere saber los concursantes inscribibles');
      }

    }

}