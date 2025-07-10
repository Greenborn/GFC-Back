<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "profiles_ranking".
 *
 * @property int $id
 * @property int $profile_id
 * @property string|null $name
 * @property int $score
 * @property string|null $prizes
 */
class ProfilesRanking extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'profiles_ranking';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['profile_id', 'score'], 'required'],
            [['profile_id', 'score'], 'default', 'value' => null],
            [['profile_id', 'score'], 'integer'],
            [['name', 'prizes'], 'string'],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'profile_id' => 'Profile ID',
            'name' => 'Name',
            'score' => 'Score',
            'prizes' => 'Prizes',
        ];
    }
}
