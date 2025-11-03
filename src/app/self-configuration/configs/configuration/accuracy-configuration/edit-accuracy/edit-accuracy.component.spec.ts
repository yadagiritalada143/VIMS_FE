import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditAccuracyComponent } from './edit-accuracy.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SnakeToTitleCasePipe } from 'src/app/shared/pipe/snake-to-title-case.pipe';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';

describe('EditAccuracyComponent', () => {
  let component: EditAccuracyComponent;
  let fixture: ComponentFixture<EditAccuracyComponent>;
  CommonTestingModule.setUpTestBed(EditAccuracyComponent);
  let SnakeToTitleCase: Partial<SnakeToTitleCasePipe>;
  let Accuracy: Partial<AccuracyPipe>;

  beforeEach(async () => {
    const SnakeToTitleCasePipe = jasmine.createSpyObj('SnakeToTitleCasePipe',['transform']);
    const accuracyPipe = jasmine.createSpyObj('AccuracyPipe',['transform']);
    await TestBed.configureTestingModule({
      declarations: [ EditAccuracyComponent ],
      providers:[
        { provide: SnakeToTitleCasePipe, useValue:  SnakeToTitleCasePipe},
        { provide: AccuracyPipe, useValue:  accuracyPipe}
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAccuracyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
