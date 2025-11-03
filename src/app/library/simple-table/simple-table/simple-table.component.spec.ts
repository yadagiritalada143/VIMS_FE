import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SimpleTableComponent } from './simple-table.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { DecimalPipe  } from '@angular/common';

describe('SimpleTableComponent', () => {
  let component: SimpleTableComponent;
  let fixture: ComponentFixture<SimpleTableComponent>;
  CommonTestingModule.setUpTestBed(SimpleTableComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SimpleTableComponent, AccuracyPipe ],
      providers: [
        DecimalPipe
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
