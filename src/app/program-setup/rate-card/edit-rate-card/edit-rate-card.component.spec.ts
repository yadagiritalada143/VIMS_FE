import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EditRateCardComponent } from './edit-rate-card.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { I18NextModule} from 'angular-i18next';

describe('EditRateCardComponent', () => {
  let component: EditRateCardComponent;
  let fixture: ComponentFixture<EditRateCardComponent>;
  let Accuracy: Partial<AccuracyPipe>;

  beforeEach(waitForAsync(() => {
    const accuracyPipe= jasmine.createSpyObj('AccuracyPipe', ['transform']);
    const i18NextPipe=jasmine.createSpyObj('I18NextPipe',['transform']);
    TestBed.configureTestingModule({
      declarations: [ EditRateCardComponent ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        I18NextModule.forRoot(),
      ],
      providers:[
        { provide: AccuracyPipe, useValue:  accuracyPipe},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditRateCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
