<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "contest".
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property date|null $start_date
 * @property date|null $end_date
 *
 * @property ContestCategory[] $contestCategories
 * @property ContestResult[] $contestResults
 * @property ContestSection[] $contestSections
 * @property ProfileContest[] $profileContests
 */
class Contest extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'contest';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['name'], 'required'],
            [['description'], 'string'],
            [['name'], 'string', 'max' => 45],
            [['start_date', 'end_date'], 'string', 'max' => 33],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'name' => 'Name',
            'description' => 'Description',
            'start_date' => 'Start Date',
            'end_date' => 'End Date',
        ];
    }

    /**
     * Gets query for [[ContestCategories]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContestCategories()
    {
        return $this->hasMany(ContestCategory::className(), ['contest_id' => 'id']);
    }
    public function getCategories()
    {
        return $this->hasMany(Category::className(), ['id' => 'category_id'])
            ->via('contestCategories');
            // ->viaTable('contest_category', ['contest_id' => 'id']);
    }

    /**
     * Gets query for [[ContestResults]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContestResults()
    {
        return $this->hasMany(ContestResult::className(), ['contest_id' => 'id']);
    }
    public function getCountContestResults(): int
    {
        $data = $this->getContestResults();
        $u = Yii::$app->user->identity;
        if ($u->role_id == 2) {// delegado
            $data = $data->where(['in', 'image.profile_id', Profile::find()->select('id')->where(['fotoclub_id' => $u->profile->fotoclub_id])])->joinWith('image');
        }
        return intval($data->count());
    }

    /**
     * Gets query for [[ContestSections]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContestSections()
    {
        return $this->hasMany(ContestSection::className(), ['contest_id' => 'id']);
    }

    public function getSections()
    {
        return $this->hasMany(Section::className(), ['id' => 'section_id'])->via('contestSections');
            // ->viaTable('contest_section', ['contest_id' => 'id']);
    }

    /**
     * Gets query for [[ProfileContests]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfileContests()
    {
        return $this->hasMany(ProfileContest::className(), ['contest_id' => 'id']);
    }
    public function getCountProfileContests(): int
    {
        $data = $this->getProfileContests();
        $u = Yii::$app->user->identity;
        if ($u->role_id == 2) {// delegado
            $data = $data->where(['in', 'profile_id', Profile::find()->select('id')->where(['fotoclub_id' => $u->profile->fotoclub_id])]);
        }
        return intval($data->count());
    }


    public function getActive(): bool
    {
        return date_diff(date_create($this->end_date), date_create())->invert == 1 ? true : false;
    }


    public function fields() {
        $fields = parent::fields();

        
        // expand por default
        // unset(  $fields['image_id'],
        //         $fields['metric_id']
        //      );
        $fields[] = 'active'; 

        return $fields;
    }
    public function extraFields() {
        return [ 
            'contestSections',      'sections',
            'contestCategories',    'categories',
            'contestResults',       'countContestResults',
            'profileContests',      'countProfileContests'
        ];
    }
}
