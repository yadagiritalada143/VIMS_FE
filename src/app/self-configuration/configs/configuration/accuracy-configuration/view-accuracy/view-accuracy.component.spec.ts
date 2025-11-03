import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewAccuracyComponent } from './view-accuracy.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SnakeToTitleCasePipe } from 'src/app/shared/pipe/snake-to-title-case.pipe';

describe('ViewAccuracyComponent', () => {
  let component: ViewAccuracyComponent;
  let fixture: ComponentFixture<ViewAccuracyComponent>;
  CommonTestingModule.setUpTestBed(ViewAccuracyComponent);
  let SnakeToTitleCase: Partial<SnakeToTitleCasePipe>

  beforeEach(async () => {
    const SnakeToTitleCasePipe = jasmine.createSpyObj('SnakeToTitleCasePipe',['transform']);
    await TestBed.configureTestingModule({
      declarations: [ ViewAccuracyComponent ],
      providers:[
        { provide: SnakeToTitleCasePipe, useValue:  SnakeToTitleCasePipe},
      ]  
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewAccuracyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
