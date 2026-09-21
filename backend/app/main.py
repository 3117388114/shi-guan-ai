from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator
from typing import Any, List, Union
from fastapi.middleware.cors import CORSMiddleware
import os
app=FastAPI(title='Esophageal Screening MVP')
cors_origins = [origin.strip() for origin in os.getenv('CORS_ORIGINS', 'https://shi-guan-ai.vercel.app,http://localhost:5173,http://127.0.0.1:5173,http://172.20.10.2:5173').split(',') if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=cors_origins, allow_methods=['*'], allow_headers=['*'])
class Assessment(BaseModel):
 age:Union[str,int,float]; smoking:Union[str,bool]; alcohol:Union[str,bool]; family:Union[str,bool]; symptoms:Union[str,List[str]]

 @field_validator('age', mode='before')
 @classmethod
 def normalize_age(cls, value):
  if isinstance(value, (int, float)) and not isinstance(value, bool):
   return '\u0036\u0030\u5c81\u53ca\u4ee5\u4e0a' if value >= 60 else ('\u0034\u0030\u2013\u0035\u0039\u5c81' if value >= 40 else '\u0034\u0030\u5c81\u4ee5\u4e0b')
  return value

 @field_validator('smoking', mode='before')
 @classmethod
 def normalize_smoking(cls, value):
  return '\u76ee\u524d\u5438\u70df' if value is True else ('\u4ece\u4e0d\u5438\u70df' if value is False else value)

 @field_validator('alcohol', mode='before')
 @classmethod
 def normalize_alcohol(cls, value):
  return '\u7ecf\u5e38\u996e\u9152' if value is True else ('\u4e0d\u996e\u9152' if value is False else value)

 @field_validator('family', mode='before')
 @classmethod
 def normalize_family(cls, value):
  return '\u6709' if value is True else ('\u6ca1\u6709' if value is False else value)

 @field_validator('symptoms', mode='before')
 @classmethod
 def normalize_symptoms(cls, value):
  if isinstance(value, list):
   return '\u6ca1\u6709' if not value else ('\u6709\u591a\u9879\u6216\u6301\u7eed\u52a0\u91cd' if len(value) > 1 else '\u6709\u5176\u4e2d\u4e00\u9879')
  return value
@app.get('/api/health')
def health(): return {'status':'ok','service':'esophageal-screening'}
@app.get('/api/questionnaire')
def questionnaire(): return {'version':'0.1-demo','disclaimer':'研究/演示原型，不用于临床诊断'}
@app.post('/api/assessment')
def assessment(data:Assessment):
 score=0; factors=[]
 rules=[('age','60岁及以上',20,'年龄因素'),('smoking','目前吸烟',20,'吸烟相关因素'),('alcohol','经常饮酒',15,'饮酒相关因素'),('family','有',25,'家族史因素'),('symptoms','有多项或持续加重',20,'症状因素')]
 for field,value,points,label in rules:
  if getattr(data,field)==value: score+=points; factors.append(label)
 level='低风险' if score<25 else ('中风险' if score<50 else '较高风险')
 rec=['保持均衡饮食，避免过烫食物，维持健康生活方式。']
 if data.symptoms!='没有': rec.append('如症状持续、明显或进行性加重，建议尽快咨询专业医疗人员。')
 else: rec.append('可结合个人情况向专业医疗人员了解适宜的筛查建议。')
 return {'risk_level':level,'risk_score':score,'factors':factors,'recommendations':rec,'disclaimer':'研究/演示原型，不用于临床诊断。'}
