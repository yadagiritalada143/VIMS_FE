import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartWidgetComponent } from './chart-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ChartWidgetComponent', () => {
  let component: ChartWidgetComponent;
  let fixture: ComponentFixture<ChartWidgetComponent>;
  CommonTestingModule.setUpTestBed(ChartWidgetComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChartWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
